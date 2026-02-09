import {
	getColumnAndLineOfPosition,
	isSuggestionForFiles,
	DirectivesCollector,
	type FileReport,
	type LanguageFileCacheImpacts,
	type LanguageDiagnostics,
	type SourceFileWithLineMap,
	type CharacterReportRange,
	type NormalizedReportRangeObject,
	type FileAboutData,
	type Suggestion,
	type AnyRuleDefinition,
	createLanguage,
	type Language,
	type RuleContext,
	type RuleReport,
} from "@flint.fyi/core";
import { setTSProgramCreationProxy } from "@flint.fyi/ts-patch";
import { proxyCreateProgram } from "@volar/typescript/lib/node/proxyCreateProgram.js";
import ts from "typescript";
import packageJson from "../package.json" with { type: "json" };

import {
	convertTypeScriptDiagnosticToLanguageFileDiagnostic,
	extractDirectivesFromTypeScriptFile,
	NodeSyntaxKinds,
	setVolarCreateFile,
	typescriptLanguage,
	type AST,
	type Checker,
	type ExtractedDirective,
	type TypeScriptFileServices,
	type TypeScriptNodesByName,
} from "@flint.fyi/typescript-language";

import type {
	LanguagePlugin as VolarLanguagePlugin,
	Language as VolarLanguage,
	Mapper as VolarMapper,
	SourceScript as VolarSourceScript,
} from "@volar/language-core";
import type { TypeScriptServiceScript as VolarTypeScriptServiceScript } from "@volar/typescript";
import { AsyncLocalStorage } from "node:async_hooks";
import { assert, FlintAssertionError } from "@flint.fyi/utils";
import type { UnsafeAnyRule } from "../../core/src/plugins/createPlugin.ts";

type VolarLanguagePluginInitializer<FileServices extends object> = (
	ts: typeof import("typescript"),
	options: ts.CreateProgramOptions,
) => {
	languagePlugins: VolarLanguagePlugin<string>[];
	createFile: VolarBasedLanguageCreateFile<FileServices>;
};

const globalTyped = globalThis as typeof globalThis & {
	_flintVolarLanguageState?: {
		packageVersion: string;
		pluginInitializers: Set<VolarLanguagePluginInitializer<object>>;
	};
};
assert(
	globalTyped._flintVolarLanguageState == null,
	`Two different versions of ${packageJson.name} are imported: ${packageJson.version} and ${globalTyped._flintVolarLanguageState?.packageVersion}`,
);
const { pluginInitializers } = (globalTyped._flintVolarLanguageState = {
	packageVersion: packageJson.version,
	pluginInitializers: new Set(),
});

type ProxiedTSProgram = ts.Program & {
	__flintVolarLanguage?: undefined | VolarLanguage<string>;
};

export type VolarBasedLanguageCreateFileContext = {
	data: FileAboutData;
	program: ts.Program;
	sourceFile: AST.SourceFile;
	volarLanguage: VolarLanguage;
	sourceScript: VolarSourceScript<string> & {
		generated: NonNullable<VolarSourceScript<string>["generated"]>;
	};
	serviceScript: VolarTypeScriptServiceScript;
};

type VolarBasedLanguageCreateFile<FileServices extends object> = (
	ctx: VolarBasedLanguageCreateFileContext,
) => {
	directives?: ExtractedDirective[];
	firstStatementPosition: number;
	reports?: FileReport[];
	cache?: LanguageFileCacheImpacts;
	getDiagnostics?(): LanguageDiagnostics;
	extraContext?: FileServices;
};

type VolarLanguagePluginWithCreateFile = VolarLanguagePlugin & {
	__flintCreateFile?: VolarBasedLanguageCreateFile<object> | undefined;
};

setTSProgramCreationProxy(
	(ts, createProgram) =>
		new Proxy(function () {} as unknown as typeof createProgram, {
			apply(target, thisArg, args) {
				let volarLanguage = null as null | VolarLanguage<string>;
				const proxied = proxyCreateProgram(ts, createProgram, (ts, options) => {
					assert(
						options.host != null,
						"createProgram was called without compiler host",
					);

					const languagePlugins = Array.from(pluginInitializers)
						.map((initializer) => initializer(ts, options))
						.flatMap(({ languagePlugins, createFile }) =>
							languagePlugins.map((plugin) => {
								if (plugin.typescript == null) {
									return plugin;
								}

								(
									plugin as VolarLanguagePluginWithCreateFile
								).__flintCreateFile = createFile;

								const { getServiceScript } = plugin.typescript;
								plugin.typescript.getServiceScript = (root) => {
									const script = getServiceScript(root);
									if (script == null) {
										return script;
									}
									return {
										...script,
										// Leading offset is useful for LanguageService [1], but we don't use it.
										// The Vue language plugin doesn't provide preventLeadingOffset [2], so we
										// have to provide it ourselves.
										//
										// [1] https://github.com/volarjs/volar.js/discussions/188
										// [2] https://github.com/vuejs/language-tools/blob/fd05a1c92c9af63e6af1eab926084efddf7c46c3/packages/language-core/lib/languagePlugin.ts#L113-L130
										preventLeadingOffset: true,
									};
								};

								return plugin;
							}),
						);
					return {
						languagePlugins,
						setup: (lang) => (volarLanguage = lang),
					};
				});

				const program: ProxiedTSProgram = Reflect.apply(proxied, thisArg, args);

				assert(volarLanguage != null, "Expected volarLanguage to be set");

				if (program.__flintVolarLanguage == null) {
					program.__flintVolarLanguage = volarLanguage;
				}

				return program;
			},
		}),
);

setVolarCreateFile((data, program, sourceFile) => {
	const volarLanguage = (program as ProxiedTSProgram).__flintVolarLanguage;
	assert(volarLanguage != null, "TypeScript wasn't proxied with Volar.js");

	const sourceScript = volarLanguage.scripts.get(sourceFile.fileName);

	assert(
		sourceScript != null,
		`Volar.js source script for ${sourceFile.fileName} is undefined`,
	);
	assert(
		sourceScript.generated != null,
		`Volar.js sourceScript.generated for ${sourceFile.fileName} is undefined`,
	);
	assert(
		sourceScript.generated.languagePlugin.typescript != null,
		`Volar.js sourceScript.generated.languagePlugin.typescript for ${sourceFile.fileName} is undefined`,
	);

	const createFile = (
		sourceScript.generated.languagePlugin as VolarLanguagePluginWithCreateFile
	).__flintCreateFile;
	assert(
		createFile != null,
		`Volar.js language plugin for script (${sourceFile.fileName}) with language id ${sourceScript.generated.root.languageId} doesn't have __flintCreateFile property`,
	);

	const sourceText = sourceScript.snapshot.getText(
		0,
		sourceScript.snapshot.getLength(),
	);
	const sourceTextWithLineMap: SourceFileWithLineMap = {
		text: sourceText,
	};
	function normalizeSourceRange(
		range: CharacterReportRange,
	): NormalizedReportRangeObject {
		return {
			begin: getColumnAndLineOfPosition(sourceTextWithLineMap, range.begin),
			end: getColumnAndLineOfPosition(sourceTextWithLineMap, range.end),
		};
	}

	const serviceScript =
		sourceScript.generated.languagePlugin.typescript.getServiceScript(
			sourceScript.generated.root,
		);
	assert(
		serviceScript != null,
		`Volar.js service script for ${sourceFile.fileName} is undefined`,
	);

	const map = volarLanguage.maps.get(serviceScript.code, sourceScript);
	const sortedMappings = map.mappings.toSorted(
		({ generatedOffsets: [a] }, { generatedOffsets: [b] }) => {
			assert(
				a != null,
				"Expected generatedOffsets to have at least one element",
			);
			assert(
				b != null,
				"Expected generatedOffsets to have at least one element",
			);
			return a - b;
		},
	);
	const {
		directives,
		firstStatementPosition,
		reports,
		extraContext,
		getDiagnostics,
		cache,
	} = createFile({
		data,
		program,
		sourceFile,
		volarLanguage,
		sourceScript: sourceScript as VolarSourceScript<string> & {
			generated: NonNullable<VolarSourceScript<string>["generated"]>;
		},
		serviceScript,
	});

	const translatedDirectives = [...(directives ?? [])];

	for (const d of extractDirectivesFromTypeScriptFile(sourceFile)) {
		const range = translateRange(map, d.range.begin.raw, d.range.end.raw);
		if (range != null) {
			translatedDirectives.push({
				...d,
				range: normalizeSourceRange(range),
			});
		}
	}

	const directivesCollector = new DirectivesCollector(firstStatementPosition);
	translatedDirectives.sort((a, b) => a.range.begin.raw - b.range.begin.raw);
	for (const { range, selection, type } of translatedDirectives) {
		directivesCollector.add(range, selection, type);
	}

	const collected = directivesCollector.collect();

	return {
		directives: collected.directives,
		reports: [...collected.reports, ...(reports ?? [])],
		language: typescriptLanguage,
		about: {
			...data,
			sourceText,
		},
		services: {
			program,
			sourceFile,
			typeChecker: program.getTypeChecker() as Checker,
			...extraContext,
		},

		adjustReportRange(range) {
			if (range.begin < 0) {
				return {
					begin: -range.begin,
					end: range.end,
				};
			}
			return translateRange(map, range.begin, range.end);
		},
		__volarServices: {
			runVisitors(file, options, runtime) {
				const { visitors } = runtime;
				if (!visitors) {
					return;
				}

				const visitorServices = { options, ...file.services };
				let lastMappingIdx = 0;
				const visit = (node: ts.Node) => {
					visitors[NodeSyntaxKinds[node.kind]]?.(node, visitorServices);

					node.forEachChild(visit);
				};
				visitors.SourceFile?.(sourceFile, visitorServices);
				// Visit only statements that have a mapping to the source code
				// to avoid doing extra work
				Statements: for (const statement of sourceFile.statements) {
					while (true) {
						const currentMapping = sortedMappings[lastMappingIdx];
						if (currentMapping == null) {
							break Statements;
						}
						const currentMappingOffset = currentMapping.generatedOffsets[0];
						const currentMappingLength =
							currentMapping.generatedLengths?.[0] ?? currentMapping.lengths[0];
						assert(
							currentMappingOffset != null,
							"Expected mapping to have at least one generated offset",
						);
						assert(
							currentMappingLength != null,
							"Expected mapping to have at least one length",
						);
						if (
							currentMappingLength === 0 ||
							statement.pos >= currentMappingOffset + currentMappingLength
						) {
							lastMappingIdx++;
							continue;
						}
						if (statement.end <= currentMappingOffset) {
							continue Statements;
						}
						break;
					}

					visit(statement);
				}
				visit(sourceFile.endOfFileToken);
			},
			// TODO: cache
			getDiagnostics() {
				return [
					...ts.getPreEmitDiagnostics(program, sourceFile).map((diagnostic) =>
						convertTypeScriptDiagnosticToLanguageFileDiagnostic({
							...diagnostic,
							// For some unknown reason, Volar doesn't set file.text to sourceText
							// when preventLeadingOffset is true, so we have to do it ourselves
							// https://github.com/volarjs/volar.js/blob/4a9d25d797d08d9c149bebf0f52ac5e172f4757d/packages/typescript/lib/node/transform.ts#L102
							file: diagnostic.file
								? {
										fileName: diagnostic.file.fileName,
										text: sourceText,
									}
								: diagnostic.file,
						}),
					),
					...(getDiagnostics?.() ?? []),
				];
			},
		},
	};
});

export function translateRange(
	map: VolarMapper,
	serviceBegin: number,
	serviceEnd: number,
): null | { begin: number; end: number } {
	for (const [begin, end] of map.toSourceRange(
		serviceBegin,
		serviceEnd,
		true,
	)) {
		if (begin === end) {
			continue;
		}
		return { begin, end };
	}
	return null;
}

export function createVolarBasedLanguage<FileServices extends object>(
	initializer: VolarLanguagePluginInitializer<FileServices>,
): Language<
	TypeScriptNodesByName,
	TypeScriptFileServices & Partial<FileServices>
> {
	pluginInitializers.add(initializer);
	return {
		...createLanguage<
			TypeScriptNodesByName,
			TypeScriptFileServices & Partial<FileServices>
		>({
			about: {
				name: "Volar.js-based language",
			},
			createFileFactory() {
				throw new FlintAssertionError(
					"Volar.js based language should never be called directly",
				);
			},
			runFileVisitors() {
				throw new FlintAssertionError(
					"Volar.js based language should never be called directly",
				);
			},
		}),
		createRule: (ruleDefinition: AnyRuleDefinition) => {
			return {
				...ruleDefinition,
				language: typescriptLanguage,
			} as UnsafeAnyRule;
		},
	};
}

export function reportSourceCode<T extends string>(
	context: RuleContext<T>,
	report: RuleReport<T>,
) {
	// TODO: suggestions, fixes
	context.report({
		...report,
		range: {
			begin: -report.range.begin,
			end: report.range.end,
		},
	});
}

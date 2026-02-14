import {
	type AnyRuleDefinition,
	type CharacterReportRange,
	createLanguage,
	DirectivesCollector,
	type FileAboutData,
	type FileReport,
	getColumnAndLineOfPosition,
	type Language,
	type LanguageDiagnostics,
	type LanguageFileCacheImpacts,
	type NormalizedReportRangeObject,
	type RuleContext,
	type RuleReport,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import { setTSProgramCreationProxy } from "@flint.fyi/ts-patch";
import {
	type AST,
	type Checker,
	convertTypeScriptDiagnosticToLanguageFileDiagnostic,
	extractDirectivesFromTypeScriptFile,
	type ExtractedDirective,
	NodeSyntaxKinds,
	setVolarCreateFile,
	type TypeScriptFileServices,
	typescriptLanguage,
	type TypeScriptNodesByName,
} from "@flint.fyi/typescript-language";
import { assert, FlintAssertionError } from "@flint.fyi/utils";
import type {
	Language as VolarLanguage,
	LanguagePlugin as VolarLanguagePlugin,
	Mapper as VolarMapper,
	SourceScript as VolarSourceScript,
} from "@volar/language-core";
import type { TypeScriptServiceScript as VolarTypeScriptServiceScript } from "@volar/typescript";
// eslint-disable-next-line no-restricted-syntax
import { proxyCreateProgram } from "@volar/typescript/lib/node/proxyCreateProgram.js";
import path from "node:path";
import ts from "typescript";

import type { UnsafeAnyRule } from "../../core/src/plugins/createPlugin.ts";
import packageJson from "../package.json" with { type: "json" };

type VolarLanguagePluginInitializer<FileServices extends object> = (
	ts: typeof import("typescript"),
	options: ts.CreateProgramOptions,
) => {
	createFile: VolarBasedLanguageCreateFile<FileServices>;
	languagePlugins: VolarLanguagePlugin<string>[];
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

export interface VolarBasedLanguageCreateFileContext {
	data: FileAboutData;
	program: ts.Program;
	serviceScript: VolarTypeScriptServiceScript;
	sourceFile: AST.SourceFile;
	sourceScript: VolarSourceScript<string> & {
		generated: NonNullable<VolarSourceScript<string>["generated"]>;
	};
	volarLanguage: VolarLanguage;
}

type ProxiedTSProgram = ts.Program & {
	__flintVolarLanguage?: undefined | VolarLanguage<string>;
};

type VolarBasedLanguageCreateFile<FileServices extends object> = (
	ctx: VolarBasedLanguageCreateFileContext,
) => {
	cache?: LanguageFileCacheImpacts;
	directives?: ExtractedDirective[];
	extraContext?: FileServices;
	firstStatementPosition: number;
	getDiagnostics?: () => LanguageDiagnostics;
	reports?: FileReport[];
};

type VolarLanguagePluginWithCreateFile = VolarLanguagePlugin & {
	__flintCreateFile?: undefined | VolarBasedLanguageCreateFile<object>;
};

setTSProgramCreationProxy(
	(ts, createProgram) =>
		new Proxy(
			function () {
				/* for apply */
			} as unknown as typeof createProgram,
			{
				apply(target, thisArg, args: unknown[]) {
					let volarLanguage = null as null | VolarLanguage<string>;
					const createProgramProxy = new Proxy(createProgram, {
						apply(target, thisArg, [options]: [ts.CreateProgramOptions]) {
							assert(
								options.host != null,
								"Expected options.host to be defined",
							);
							const patchedGetSourceFile = options.host.getSourceFile.bind(
								options.host,
							);
							options.host.getSourceFile = (...args) => {
								try {
									return patchedGetSourceFile(...args);
								} catch (error) {
									if (
										error instanceof Error &&
										error.message === "!!sourceScript"
									) {
										const fileExtension = path.extname(args[0]);
										let message = "Unknown extension.";
										switch (fileExtension) {
											case ".astro":
												message = "Did you install & import @flint.fyi/astro?";
												break;
											case ".mdx":
												message = "Did you install & import @flint.fyi/mdx?";
												break;
											case ".vue":
												message = "Did you install & import @flint.fyi/vue?";
												break;
										}

										throw new Error(`Cannot process ${args[0]}. ${message}`);
									}
									throw error;
								}
							};
							return Reflect.apply(target, thisArg, args) as ts.Program;
						},
					});
					const proxied = proxyCreateProgram(
						ts,
						createProgramProxy,
						(ts, options) => {
							const languagePlugins = Array.from(pluginInitializers)
								.map((initializer) => initializer(ts, options))
								.flatMap(({ createFile, languagePlugins }) =>
									languagePlugins.map((plugin) => {
										if (plugin.typescript == null) {
											return plugin;
										}

										(
											plugin as VolarLanguagePluginWithCreateFile
										).__flintCreateFile = createFile;

										const getServiceScript =
											plugin.typescript.getServiceScript.bind(
												plugin.typescript,
											);
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
								setup: (lang) => {
									volarLanguage = lang;
								},
							};
						},
					);

					const program = Reflect.apply(
						proxied,
						thisArg,
						args,
					) as ProxiedTSProgram;

					assert(volarLanguage != null, "Expected volarLanguage to be set");

					program.__flintVolarLanguage ??= volarLanguage;

					return program;
				},
			},
		),
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
		extraContext,
		firstStatementPosition,
		getDiagnostics,
		reports,
	} = createFile({
		data,
		program,
		serviceScript,
		sourceFile,
		sourceScript: sourceScript as VolarSourceScript<string> & {
			generated: NonNullable<VolarSourceScript<string>["generated"]>;
		},
		volarLanguage,
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
		__volarServices: {
			runVisitors(file, options, runtime) {
				const { visitors } = runtime;
				if (!visitors) {
					return;
				}

				const visitorServices = { options, ...file.services };
				let lastMappingIdx = 0;
				const visit = (node: ts.Node) => {
					const key = NodeSyntaxKinds[node.kind] as keyof TypeScriptNodesByName;

					// @ts-expect-error -- The node parameter type shouldn't be `never`...?
					visitors[key]?.(node, visitorServices);

					node.forEachChild(visit);

					// @ts-expect-error -- The node parameter type shouldn't be `never`...?
					visitors[`${key}:exit`]?.(node, visitorServices);
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
		about: {
			...data,
			sourceText,
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
		directives: collected.directives,
		language: typescriptLanguage,

		reports: [...collected.reports, ...(reports ?? [])],
		services: {
			program,
			sourceFile,
			typeChecker: program.getTypeChecker() as Checker,
			...extraContext,
		},
	};
});

export function createVolarBasedLanguage<FileServices extends object>(
	initializer: VolarLanguagePluginInitializer<FileServices>,
): Language<
	TypeScriptNodesByName,
	Partial<FileServices> & TypeScriptFileServices
> {
	pluginInitializers.add(initializer);
	return {
		...createLanguage<
			TypeScriptNodesByName,
			Partial<FileServices> & TypeScriptFileServices
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
			// flint-disable-next-line anyReturns
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

function translateRange(
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

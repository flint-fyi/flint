import path from "node:path";

import { debugForFile } from "debug-for-file";
import {
	SpanMap,
	SyntaxKind,
	type Node as NativeNode,
} from "typescript-native/unstable/ast";
import type {
	Checker,
	Diagnostic,
	Program,
	Project,
	Snapshot,
} from "typescript-native/unstable/sync";

import {
	createLanguage,
	getColumnAndLineOfPosition,
	type CharacterReportRange,
	type FileAboutData,
	type Language,
	type LanguageFileDefinition,
	type LanguageReports,
	type RuleVisitors,
} from "@flint.fyi/core";
import { assert, nullThrows } from "@flint.fyi/utils";

import packageJson from "../package.json" with { type: "json" };
import { getTypeScriptContentMapperRegistrations } from "./contentMappers.ts";
import { convertTypeScriptDiagnosticToLanguageReport } from "./convertTypeScriptDiagnosticToLanguageReport.ts";
import {
	createTypeScriptProjectSession,
	type TypeScriptProjectSession,
} from "./createTypeScriptProjectSession.ts";
import { parseDirectivesFromTypeScriptFile } from "./directives/parseDirectivesFromTypeScriptFile.ts";
import { getFirstEnumValues } from "./getFirstEnumValues.ts";
import { getTypeScriptDiagnostics } from "./getTypeScriptDiagnostics.ts";
import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";
import type { TypeScriptNodesByName, TypeScriptNodeVisitors } from "./nodes.ts";
import { orderTypeScriptFilePaths } from "./orderTypeScriptFilePaths.ts";
import type * as AST from "./types/ast.ts";

export interface TypeScriptFileServices {
	checker: Checker;
	program: Program;
	project: Project;
	snapshot: Snapshot;
	sourceFile: AST.SourceFile;
	spanMap: SpanMap | undefined;
}

const log = debugForFile(import.meta.filename);

export const NodeSyntaxKinds: typeof SyntaxKind =
	getFirstEnumValues(SyntaxKind);

type ContentMappedLanguageFileDefinition =
	LanguageFileDefinition<TypeScriptFileServices> & {
		__contentMapperLanguageReports: LanguageReports;
	};

interface GlobalLanguageState {
	packageVersion: string;
}

export function visitTypeScriptNodes<Services extends object>(
	sourceFile: AST.SourceFile,
	visitors: RuleVisitors<TypeScriptNodeVisitors, Services>,
	services: Services,
): void {
	const visit = (node: NativeNode): void => {
		const syntaxKindName = NodeSyntaxKinds[node.kind];
		if (typeof syntaxKindName !== "string") {
			node.forEachChild(visit);
			return;
		}

		const key = syntaxKindName as keyof TypeScriptNodesByName;

		// @ts-expect-error -- A dynamically selected visitor accepts this kind's node.
		visitors[key]?.(node, services);
		node.forEachChild(visit);
		// @ts-expect-error -- A dynamically selected visitor accepts this kind's node.
		visitors[`${key}:exit`]?.(node, services);
	};

	visit(sourceFile);
}

function adjustMappedRange(
	range: CharacterReportRange,
	spanMap: SpanMap | undefined,
	requireExact = false,
): CharacterReportRange | null {
	if (range.begin < 0) {
		return { begin: -range.begin, end: range.end };
	}
	if (!spanMap) {
		return null;
	}
	const mapped = spanMap.virtualToOriginalSpan({
		end: range.end,
		pos: range.begin,
	});
	if (
		SpanMap.isNone(mapped.fidelity) ||
		(requireExact && !SpanMap.isExact(mapped.fidelity))
	) {
		return null;
	}
	return { begin: mapped.range.pos, end: mapped.range.end };
}

function getMappedSourceFiles(
	program: Program,
	sourceFile: AST.SourceFile,
): AST.SourceFile[] {
	const sourceFiles = [sourceFile];
	for (const fileName of new Set(
		sourceFile.supplementalSourceFileNames ?? [],
	)) {
		const supplementalSourceFile = program.getSourceFile(fileName);
		if (supplementalSourceFile && supplementalSourceFile !== sourceFile) {
			sourceFiles.push(supplementalSourceFile as AST.SourceFile);
		}
	}
	return sourceFiles;
}

function mapDiagnosticToAuthoredSource(
	diagnostic: Diagnostic,
	sourceFiles: AST.SourceFile[],
	about: FileAboutData,
): Diagnostic | undefined {
	const relatedInformation = diagnostic.relatedInformation?.flatMap(
		(related) => {
			const mapped = mapDiagnosticToAuthoredSource(related, sourceFiles, about);
			return mapped ? [mapped] : [];
		},
	);
	const sourceFile = sourceFiles.find(
		(candidate) => candidate.fileName === diagnostic.fileName,
	);
	if (!sourceFile?.spanMap) {
		return {
			...diagnostic,
			...(relatedInformation && { relatedInformation }),
		};
	}
	const range = adjustMappedRange(
		{ begin: diagnostic.pos, end: diagnostic.end },
		sourceFile.spanMap,
	);
	if (!range) {
		return undefined;
	}
	const startPosition = getColumnAndLineOfPosition(
		about.sourceText,
		range.begin,
	);
	const endPosition = getColumnAndLineOfPosition(about.sourceText, range.end);
	return {
		...diagnostic,
		end: range.end,
		endPosition: {
			character: endPosition.column,
			line: endPosition.line,
		},
		fileName: about.filePathAbsolute,
		pos: range.begin,
		...(relatedInformation && { relatedInformation }),
		startPosition: {
			character: startPosition.column,
			line: startPosition.line,
		},
	};
}

const stateSymbol = Symbol.for("@flint.fyi/typescript-language/state");

const globalTyped = globalThis as typeof globalThis & {
	[stateSymbol]?: GlobalLanguageState;
};

assert(
	globalTyped[stateSymbol] == null,
	`Two different versions of ${packageJson.name} are imported: ${packageJson.version} and ${globalTyped[stateSymbol]?.packageVersion}`,
);

globalTyped[stateSymbol] = {
	packageVersion: packageJson.version,
};

export const typescriptLanguage: Language<
	TypeScriptNodeVisitors,
	TypeScriptFileServices
> = createLanguage({
	about: {
		name: "TypeScript",
	},
	createFileFactory: (host) => {
		const unwrapError = (error: unknown): unknown[] =>
			error instanceof AggregateError ? error.errors : [error];
		let sessionState:
			| undefined
			| {
					activeFiles: number;
					disposed: boolean;
					openFiles: string[];
					session: TypeScriptProjectSession;
					sourceTextByFilePath: Map<string, string | undefined>;
			  };
		let disposed = false;
		let failed = false;
		const disposeSession = (
			currentSessionState: NonNullable<typeof sessionState>,
		): void => {
			if (currentSessionState.disposed) {
				return;
			}
			currentSessionState.disposed = true;
			currentSessionState.session[Symbol.dispose]();
		};
		const disposeSessionForFailure = (
			currentSessionState: NonNullable<typeof sessionState>,
		): undefined | { disposalError: unknown } => {
			try {
				disposeSession(currentSessionState);
			} catch (disposalError) {
				return { disposalError };
			}
		};
		const failSession = (
			currentSessionState: NonNullable<typeof sessionState>,
			error: unknown,
		): never => {
			failed = true;
			const disposalFailure = disposeSessionForFailure(currentSessionState);
			if (disposalFailure) {
				throw new AggregateError(
					[error, ...unwrapError(disposalFailure.disposalError)],
					"TypeScript file creation and project session cleanup both failed.",
					{ cause: error },
				);
			}
			throw error;
		};

		const updateTrackedSourceFiles = (
			currentSessionState: NonNullable<typeof sessionState>,
		): void => {
			const snapshot = currentSessionState.session.getSnapshot();
			const sourceFileNames = new Set<string>();
			for (const project of snapshot.getProjects()) {
				for (const fileName of project.program.getSourceFileNames()) {
					sourceFileNames.add(fileName);
				}
			}
			currentSessionState.sourceTextByFilePath = new Map(
				Array.from(sourceFileNames, (fileName) => [
					fileName,
					host.readFileSync(fileName),
				]),
			);
		};

		function createFile(data: FileAboutData) {
			if (disposed || failed) {
				throw new Error("TypeScript project session has been disposed.");
			}
			const currentSessionState = (sessionState ??= {
				activeFiles: 0,
				disposed: false,
				openFiles: [] as string[],
				session: createTypeScriptProjectSession(host),
				sourceTextByFilePath: new Map<string, string | undefined>(),
			});

			log("Opening native file:", data.filePathAbsolute);
			const restartingOpenFiles =
				currentSessionState.openFiles.length > 0 &&
				currentSessionState.activeFiles === 0;
			if (restartingOpenFiles) {
				try {
					currentSessionState.session.update({
						closeFiles: [...currentSessionState.openFiles],
					});
				} catch (error) {
					return failSession(currentSessionState, error);
				}
			}
			const openingFile = !currentSessionState.openFiles.includes(
				data.filePathAbsolute,
			);
			if (openingFile) {
				currentSessionState.openFiles.push(data.filePathAbsolute);
			}
			const changed = [data.filePathAbsolute];
			const deleted: string[] = [];
			for (const [
				filePath,
				previousSourceText,
			] of currentSessionState.sourceTextByFilePath) {
				const sourceText = host.readFileSync(filePath);
				if (sourceText === undefined) {
					deleted.push(filePath);
				} else if (sourceText !== previousSourceText) {
					changed.push(filePath);
				}
			}
			try {
				currentSessionState.session.update({
					changed: [...new Set(changed)],
					...(deleted.length && { deleted }),
					...(restartingOpenFiles
						? { openFiles: [...currentSessionState.openFiles] }
						: openingFile
							? { openFiles: [data.filePathAbsolute] }
							: {}),
				});
				updateTrackedSourceFiles(currentSessionState);
			} catch (error) {
				return failSession(currentSessionState, error);
			}
			let fileDisposed = false;

			const getSnapshot = (): Snapshot => {
				if (currentSessionState.disposed) {
					throw new Error("TypeScript project session has been disposed.");
				}
				return currentSessionState.session.getSnapshot();
			};
			const getProject = (): Project => {
				getSnapshot();
				return nullThrows(
					currentSessionState.session.getProjectForFile(data.filePathAbsolute),
					`Could not find project for file: ${data.filePathAbsolute}`,
				);
			};
			const getSourceFile = (): AST.SourceFile =>
				nullThrows(
					getProject().program.getSourceFile(data.filePathAbsolute),
					`Could not retrieve source file for: ${data.filePathAbsolute}`,
				) as AST.SourceFile;
			const services: TypeScriptFileServices = {
				get checker() {
					return getProject().checker;
				},
				get program() {
					return getProject().program;
				},
				get project() {
					return getProject();
				},
				get snapshot() {
					return getSnapshot();
				},
				get sourceFile() {
					return getSourceFile();
				},
				get spanMap() {
					return getSourceFile().spanMap;
				},
			};
			const dispose = (): void => {
				if (fileDisposed) {
					return;
				}
				fileDisposed = true;
				currentSessionState.activeFiles -= 1;
			};
			try {
				const sourceFile = getSourceFile();
				const fileExtension = path.extname(data.filePathAbsolute);
				const mapperRegistration =
					getTypeScriptContentMapperRegistrations().find((registration) =>
						registration.extensions.includes(fileExtension),
					);
				if (
					typeScriptCoreSupportedExtensions.has(fileExtension) ||
					mapperRegistration
				) {
					const mapped = mapperRegistration?.createFile?.({
						about: data,
						services,
						sourceFile,
						sourceText: host.readFileSync(data.filePathAbsolute) ?? "",
					});
					if (mapped?.services) {
						Object.assign(services, mapped.services);
					}
					const file = {
						...(mapperRegistration
							? {
									...(mapped?.languageReports && {
										__contentMapperLanguageReports: mapped.languageReports,
									}),
									...(mapped?.directives && { directives: mapped.directives }),
									...(mapped?.reports && { reports: mapped.reports }),
								}
							: parseDirectivesFromTypeScriptFile(sourceFile)),
						about: data,
						...(mapperRegistration && {
							adjustFixRange: (range: CharacterReportRange) =>
								adjustMappedRange(range, sourceFile.spanMap, true),
							adjustReportRange: (range: CharacterReportRange) =>
								adjustMappedRange(range, sourceFile.spanMap),
						}),
						language: typescriptLanguage,
						services,
						[Symbol.dispose]: dispose,
					};
					currentSessionState.activeFiles += 1;
					return file;
				}

				throwUnknownLanguageExtension(data.filePathAbsolute);
			} catch (error) {
				return failSession(currentSessionState, error);
			}
		}

		return {
			createFile,
			[Symbol.dispose]: () => {
				if (disposed) {
					return;
				}
				disposed = true;
				if (sessionState) {
					disposeSession(sessionState);
				}
			},
		};
	},

	getFileCacheImpacts: getTypeScriptFileCacheImpacts,
	getLanguageReports(file) {
		const reports: LanguageReports = [];
		const reportKeys = new Set<string>();
		const sourceFiles = getMappedSourceFiles(
			file.services.program,
			file.services.sourceFile,
		);
		for (const sourceFile of sourceFiles) {
			for (const diagnostic of getTypeScriptDiagnostics(
				file.services.program,
				sourceFile.fileName,
			)) {
				const mappedDiagnostic = mapDiagnosticToAuthoredSource(
					diagnostic,
					sourceFiles,
					file.about,
				);
				if (!mappedDiagnostic) {
					continue;
				}
				const report =
					convertTypeScriptDiagnosticToLanguageReport(mappedDiagnostic);
				const key = JSON.stringify([
					mappedDiagnostic.category,
					mappedDiagnostic.code,
					mappedDiagnostic.text,
					mappedDiagnostic.messageChain,
					mappedDiagnostic.relatedInformation,
					report.range,
				]);
				if (!reportKeys.has(key)) {
					reportKeys.add(key);
					reports.push(report);
				}
			}
		}
		return "__contentMapperLanguageReports" in file
			? [
					...reports,
					...(file as ContentMappedLanguageFileDefinition)
						.__contentMapperLanguageReports,
				]
			: reports;
	},
	orderFilePaths: orderTypeScriptFilePaths,
	runFileVisitors(file, options, runtime) {
		if (!runtime.visitors) {
			return;
		}

		const { visitors } = runtime;
		for (const sourceFile of getMappedSourceFiles(
			file.services.program,
			file.services.sourceFile,
		)) {
			const adjustFixRange = file.adjustFixRange;
			const adjustReportRange = file.adjustReportRange;
			if (adjustFixRange) {
				file.adjustFixRange = (range) =>
					adjustMappedRange(range, sourceFile.spanMap, true);
			}
			if (adjustReportRange) {
				file.adjustReportRange = (range) =>
					adjustMappedRange(range, sourceFile.spanMap);
			}
			try {
				visitTypeScriptNodes(sourceFile, visitors, {
					options,
					...file.services,
					sourceFile,
					spanMap: sourceFile.spanMap,
				});
			} finally {
				if (adjustFixRange) {
					file.adjustFixRange = adjustFixRange;
				} else {
					delete file.adjustFixRange;
				}
				if (adjustReportRange) {
					file.adjustReportRange = adjustReportRange;
				} else {
					delete file.adjustReportRange;
				}
			}
		}
	},
});

const typeScriptCoreSupportedExtensions: ReadonlySet<string> = new Set([
	".cjs",
	".cts",
	".d.cts",
	".d.mts",
	".d.ts",
	".js",
	".json",
	".jsx",
	".mjs",
	".mts",
	".ts",
	".tsx",
]);

const fileExtToFlintPlugin: Record<string, string> = {
	".astro": "@flint.fyi/astro",
	".gjs": "@flint.fyi/ember",
	".gts": "@flint.fyi/ember",
	".mdx": "@flint.fyi/mdx",
	".svelte": "@flint.fyi/svelte",
	".vue": "@flint.fyi/vue",
};

export function throwUnknownLanguageExtension(filename: string): never {
	const pluginName = fileExtToFlintPlugin[path.extname(filename)];
	const message = pluginName
		? `Did you install & import ${pluginName}?`
		: "Unknown extension.";
	throw new Error(`Cannot process ${filename}. ${message}`);
}

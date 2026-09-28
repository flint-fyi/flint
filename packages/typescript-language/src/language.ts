import path from "node:path";

import { debugForFile } from "debug-for-file";
import {
	SpanMap,
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
import { createCachedChecker } from "./createCachedChecker.ts";
import { createNodeVisitorsForFile } from "./createNodeVisitorsForFile.ts";
import {
	createTypeScriptProjectSession,
	type TypeScriptProjectSession,
} from "./createTypeScriptProjectSession.ts";
import { parseDirectivesFromTypeScriptFile } from "./directives/parseDirectivesFromTypeScriptFile.ts";
import { getTypeScriptDiagnostics } from "./getTypeScriptDiagnostics.ts";
import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";
import { isInferredProject } from "./isInferredProject.ts";
import type { TypeScriptNodesByName, TypeScriptNodeVisitors } from "./nodes.ts";
import { NodeSyntaxKinds } from "./nodeSyntaxKinds.ts";
import { orderTypeScriptFilePaths } from "./orderTypeScriptFilePaths.ts";
import type * as AST from "./types/ast.ts";
import type { TypeScriptFileServices } from "./types/services.ts";

export type { TypeScriptFileServices } from "./types/services.ts";

const log = debugForFile(import.meta.filename);

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
	// Rules that already report in authored coordinates (through
	// `@flint.fyi/content-mapper`'s `reportSourceCode`) encode `begin` as
	// `-1 - begin`, which unlike plain negation can represent offset 0.
	if (range.begin < 0) {
		return { begin: -1 - range.begin, end: range.end };
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
	for (const fileName of new Set(sourceFile.supplementalSourceFileNames)) {
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
	// TypeScript already reports a content-mapped file's diagnostics in
	// authored coordinates, with positions and context lines taken from the
	// authored text, whenever its span map covers them. Diagnostics inside
	// synthesized code that maps to nothing keep their virtual coordinates
	// instead, and nothing in the response says which is which.
	if (!isInAuthoredCoordinates(diagnostic, about.sourceText)) {
		return undefined;
	}
	return {
		...diagnostic,
		fileName: about.filePathAbsolute,
		...(relatedInformation && { relatedInformation }),
	};
}

/**
 * Whether a content-mapped file's diagnostic is positioned in the authored
 * text: its positions agree with the authored text's line map, and the
 * context lines TypeScript attached are the authored text's lines. A
 * diagnostic left in virtual coordinates fails at least one of those, because
 * the virtual file's lines differ from the authored file's.
 */
function isInAuthoredCoordinates(
	diagnostic: Diagnostic,
	sourceText: string,
): boolean {
	const { end, endPosition, pos, sourceLines, startPosition } = diagnostic;
	if (
		!startPosition ||
		!endPosition ||
		!sourceLines ||
		end > sourceText.length
	) {
		return false;
	}
	const start = getColumnAndLineOfPosition(sourceText, pos);
	const finish = getColumnAndLineOfPosition(sourceText, end);
	if (
		start.line !== startPosition.line ||
		start.column !== startPosition.character ||
		finish.line !== endPosition.line ||
		finish.column !== endPosition.character
	) {
		return false;
	}
	const lines = sourceText.split("\n");
	return sourceLines.every(
		({ line, text }) =>
			text.replace(/\r?\n$/, "") === lines[line]?.replace(/\r$/, ""),
	);
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
					prepared: boolean;
					session: TypeScriptProjectSession;
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

		function createFile(data: FileAboutData) {
			if (disposed || failed) {
				throw new Error("TypeScript project session has been disposed.");
			}
			const fileExtension = path.extname(data.filePathAbsolute);
			const mapperRegistration = getTypeScriptContentMapperRegistrations().find(
				(registration) => registration.extensions.includes(fileExtension),
			);
			// A file no registered mapper claims is refused before the native
			// session is touched: opening it would only fail later with a project
			// lookup error, hiding which plugin the user is missing.
			if (
				!typeScriptCoreSupportedExtensions.has(fileExtension) &&
				!mapperRegistration
			) {
				throwUnknownLanguageExtension(data.filePathAbsolute);
			}
			const currentSessionState = (sessionState ??= {
				activeFiles: 0,
				disposed: false,
				openFiles: [] as string[],
				prepared: false,
				session: createTypeScriptProjectSession(host),
			});

			log("Opening native file:", data.filePathAbsolute);
			// When prepareFiles has already batch-opened every file, the snapshot is
			// stable and this file is directly queryable, so the per-file update is
			// skipped — doing one update per file is quadratic in the file count.
			const alreadyPrepared =
				currentSessionState.prepared &&
				currentSessionState.openFiles.includes(data.filePathAbsolute);
			const openingFile =
				!alreadyPrepared &&
				!currentSessionState.openFiles.includes(data.filePathAbsolute);
			if (!alreadyPrepared) {
				const restartingOpenFiles =
					currentSessionState.openFiles.length &&
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
				if (openingFile) {
					currentSessionState.openFiles.push(data.filePathAbsolute);
				}
				// The session detects changes to every other file it is tracking by
				// comparing modification times, so only the file being opened needs to
				// be flagged as changed here.
				try {
					currentSessionState.session.update({
						changed: [data.filePathAbsolute],
						...(restartingOpenFiles
							? { openFiles: [...currentSessionState.openFiles] }
							: openingFile
								? { openFiles: [data.filePathAbsolute] }
								: {}),
					});
				} catch (error) {
					return failSession(currentSessionState, error);
				}
			}
			let fileDisposed = false;

			// The project and source file are resolved through native lookups, and
			// every access to a service getter (and each is invoked whenever the
			// services are spread into a visitor run) would otherwise repeat them.
			// They are stable while the snapshot is unchanged — which it is for the
			// whole visitor phase — so memoize them and invalidate on a new snapshot.
			let cachedSnapshot: Snapshot | undefined;
			let cachedProject: Project | undefined;
			let cachedSourceFile: AST.SourceFile | undefined;
			let cachedTypeChecker: Checker | undefined;
			const getSnapshot = (): Snapshot => {
				if (currentSessionState.disposed) {
					throw new Error("TypeScript project session has been disposed.");
				}
				return currentSessionState.session.getSnapshot();
			};
			const getProject = (): Project => {
				const snapshot = getSnapshot();
				if (snapshot !== cachedSnapshot) {
					cachedSnapshot = snapshot;
					cachedProject = undefined;
					cachedSourceFile = undefined;
					cachedTypeChecker = undefined;
				}
				cachedProject ??= nullThrows(
					currentSessionState.session.getProjectForFile(data.filePathAbsolute),
					`Could not find project for file: ${data.filePathAbsolute}`,
				);
				return cachedProject;
			};
			const getSourceFile = (): AST.SourceFile => {
				const project = getProject();
				cachedSourceFile ??= nullThrows(
					project.program.getSourceFile(data.filePathAbsolute),
					`Could not retrieve source file for: ${data.filePathAbsolute}`,
				) as AST.SourceFile;
				return cachedSourceFile;
			};
			const services: TypeScriptFileServices = {
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
				get typeChecker() {
					cachedTypeChecker ??= createCachedChecker(
						getProject().checker,
						getSourceFile(),
					);
					return cachedTypeChecker;
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
				const mapped = mapperRegistration?.createFile?.({
					about: data,
					services,
					sourceFile,
					sourceText: data.sourceText,
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
			} catch (error) {
				// A failure to prepare this one file (for example, a content-mapped
				// file with no ancestor tsconfig) must not tear down the session that
				// every other file shares. Roll back this file's open state and
				// rethrow so only this file fails.
				if (openingFile) {
					const index = currentSessionState.openFiles.indexOf(
						data.filePathAbsolute,
					);
					if (index !== -1) {
						currentSessionState.openFiles.splice(index, 1);
					}
				}
				throw error;
			}
		}

		function prepareFiles(filePathsAbsolute: readonly string[]) {
			if (disposed || failed || !filePathsAbsolute.length) {
				return;
			}
			const currentSessionState = (sessionState ??= {
				activeFiles: 0,
				disposed: false,
				openFiles: [] as string[],
				prepared: false,
				session: createTypeScriptProjectSession(host),
			});
			const alreadyOpen = new Set(currentSessionState.openFiles);
			const newFilePaths = filePathsAbsolute.filter(
				(filePath) => !alreadyOpen.has(filePath),
			);
			if (!newFilePaths.length) {
				currentSessionState.prepared = true;
				return;
			}
			for (const filePath of newFilePaths) {
				currentSessionState.openFiles.push(filePath);
			}
			// Open every file in a single update so the whole lint pass builds the
			// program once, rather than rebuilding it per file (which is quadratic).
			try {
				currentSessionState.session.update({
					changed: [...newFilePaths],
					openFiles: [...currentSessionState.openFiles],
				});
				currentSessionState.prepared = true;
			} catch {
				// Batch preparation failed (for example, a malformed tsconfig). Roll
				// back so createFile falls back to opening files one at a time, which
				// preserves per-file error isolation.
				for (const filePath of newFilePaths) {
					const index = currentSessionState.openFiles.indexOf(filePath);
					if (index !== -1) {
						currentSessionState.openFiles.splice(index, 1);
					}
				}
				currentSessionState.prepared = false;
			}
		}

		return {
			createFile,
			prepareFiles,
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
	getLanguageReports(file, host) {
		const currentDirectory = host.getCurrentDirectory();
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
				{
					includeConfigurationDiagnostics: !isInferredProject(
						file.services.project,
					),
				},
			)) {
				const mappedDiagnostic = mapDiagnosticToAuthoredSource(
					diagnostic,
					sourceFiles,
					file.about,
				);
				if (!mappedDiagnostic) {
					continue;
				}
				const report = convertTypeScriptDiagnosticToLanguageReport(
					mappedDiagnostic,
					currentDirectory,
				);
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
	runFileVisitors(file, fileVisitors) {
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
				// Walk each mapped source file once for all of its rules. For
				// content-mapped supplemental source files, re-key every rule's
				// services to that source file so reports land in the right
				// coordinates; the primary source file uses the visitors as-is.
				const sourceFileVisitors =
					sourceFile === file.services.sourceFile
						? fileVisitors
						: fileVisitors.map((fileVisitor) => ({
								...fileVisitor,
								services: {
									...fileVisitor.services,
									sourceFile,
									spanMap: sourceFile.spanMap,
								},
							}));
				createNodeVisitorsForFile(sourceFileVisitors)?.visit(sourceFile);
			} finally {
				// Only mapped files had their adjusters swapped above, so only those
				// need them restored.
				if (adjustFixRange) {
					file.adjustFixRange = adjustFixRange;
				}
				if (adjustReportRange) {
					file.adjustReportRange = adjustReportRange;
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

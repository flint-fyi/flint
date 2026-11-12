import path from "node:path";

import { debugForFile } from "debug-for-file";
import { SpanMap } from "typescript-native/ast";
import { toRootedFilePath } from "typescript-native/path";
import type {
	Checker,
	Diagnostic,
	Program,
	Project,
	Snapshot,
} from "typescript-native/sync";

import {
	createLanguage,
	getColumnAndLineOfPosition,
	type CharacterReportRange,
	type FileAboutData,
	type Language,
	type LanguageFileDefinition,
	type LanguageReports,
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
import { isNativeProcessFailure } from "./isNativeProcessFailure.ts";
import type { TypeScriptNodeVisitors } from "./nodes.ts";
import { orderTypeScriptFilePaths } from "./orderTypeScriptFilePaths.ts";
import type * as AST from "./types/ast.ts";
import type { TypeScriptFileServices } from "./types/services.ts";

const log = debugForFile(import.meta.filename);

type ContentMappedLanguageFileDefinition =
	LanguageFileDefinition<TypeScriptFileServices> & {
		__contentMapperLanguageReports: LanguageReports;
	};

interface GlobalLanguageState {
	packageVersion: string;
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
		fileName: toRootedFilePath(about.filePathAbsolute, undefined),
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
		let sessionState:
			| undefined
			| {
					activeFiles: number;
					openFiles: Set<string>;
					prepared: boolean;
					runsExternalCode: boolean;
					session: TypeScriptProjectSession;
			  };
		let disposed = false;
		let failed = false;
		const abandonSession = (
			currentSessionState: NonNullable<typeof sessionState>,
		): void => {
			try {
				currentSessionState.session[Symbol.dispose]();
			} catch (error) {
				log("Failed to dispose an abandoned session:", error);
			}
			if (sessionState === currentSessionState) {
				sessionState = undefined;
			}
		};
		// TypeScript's native process exiting takes every project it held with
		// it, but nothing about the next process: unlike a session that failed
		// while its process kept running, it can be replaced.
		const failSession = (
			currentSessionState: NonNullable<typeof sessionState>,
			error: unknown,
		): never => {
			if (!isNativeProcessFailure(error)) {
				failed = true;
			}
			abandonSession(currentSessionState);
			throw error;
		};

		const getSessionState = (): NonNullable<typeof sessionState> => {
			const runExternalCode =
				!!getTypeScriptContentMapperRegistrations().length;
			// TypeScript only runs content mappers in a process started with
			// permission to, so a session from before the first mapper was
			// registered is replaced once no file is still using it.
			if (
				sessionState &&
				!sessionState.runsExternalCode &&
				!sessionState.activeFiles &&
				runExternalCode
			) {
				sessionState.session[Symbol.dispose]();
				sessionState = undefined;
			}
			sessionState ??= {
				activeFiles: 0,
				openFiles: new Set(),
				prepared: false,
				runsExternalCode: runExternalCode,
				session: createTypeScriptProjectSession(host, { runExternalCode }),
			};
			return sessionState;
		};

		function createFile(data: FileAboutData) {
			try {
				return createFileInSession(data);
			} catch (error) {
				if (!isNativeProcessFailure(error)) {
					throw error;
				}
				// The process may have exited because of an earlier file, so this
				// file gets one attempt in a new process before being blamed.
				log("Native process exited; retrying:", data.filePathAbsolute);
				try {
					return createFileInSession(data);
				} catch (retryError) {
					if (!isNativeProcessFailure(retryError)) {
						throw retryError;
					}
					throw new Error(
						`TypeScript's native process exited while opening ${data.filePathAbsolute}.`,
						{ cause: retryError },
					);
				}
			}
		}

		function createFileInSession(data: FileAboutData) {
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
			const currentSessionState = getSessionState();

			log("Opening native file:", data.filePathAbsolute);
			// When prepareFiles has already batch-opened every file, the snapshot is
			// stable and this file is directly queryable, so the per-file update is
			// skipped — doing one update per file is quadratic in the file count.
			const openingFile = !currentSessionState.openFiles.has(
				data.filePathAbsolute,
			);
			if (openingFile || !currentSessionState.prepared) {
				const restartingOpenFiles =
					currentSessionState.openFiles.size &&
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
					currentSessionState.openFiles.add(data.filePathAbsolute);
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
			const getProject = (): Project => {
				const snapshot = currentSessionState.session.getSnapshot();
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
				get sourceFile() {
					return getSourceFile();
				},
				get spanMap() {
					return getSourceFile().spanMap;
				},
				get typeChecker() {
					const project = getProject();
					cachedTypeChecker ??= createCachedChecker(
						project.checker,
						getSourceFile(),
						currentSessionState.session.batch,
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
				if (isNativeProcessFailure(error)) {
					abandonSession(currentSessionState);
					throw error;
				}
				if (openingFile) {
					currentSessionState.openFiles.delete(data.filePathAbsolute);
				}
				throw error;
			}
		}

		function prepareFiles(filePathsAbsolute: readonly string[]): void {
			if (disposed || failed || !filePathsAbsolute.length) {
				return;
			}
			// As in createFile, the process may have exited because of an earlier
			// file, so the batch gets one attempt in a new process.
			if (!prepareFilesInSession(filePathsAbsolute)) {
				log("Native process exited while preparing files; retrying.");
				prepareFilesInSession(filePathsAbsolute);
			}
		}

		/**
		 * @returns Whether the native process survived the attempt.
		 */
		function prepareFilesInSession(
			filePathsAbsolute: readonly string[],
		): boolean {
			const currentSessionState = getSessionState();
			const newFilePaths = filePathsAbsolute.filter(
				(filePath) => !currentSessionState.openFiles.has(filePath),
			);
			if (!newFilePaths.length) {
				currentSessionState.prepared = true;
				return true;
			}
			for (const filePath of newFilePaths) {
				currentSessionState.openFiles.add(filePath);
			}
			// Open every file in a single update so the whole lint pass builds the
			// program once, rather than rebuilding it per file (which is quadratic).
			try {
				currentSessionState.session.update({
					changed: newFilePaths,
					openFiles: [...currentSessionState.openFiles],
				});
				currentSessionState.prepared = true;
			} catch (error) {
				if (isNativeProcessFailure(error)) {
					abandonSession(currentSessionState);
					return false;
				}
				// Batch preparation failed (for example, a malformed tsconfig). Roll
				// back so createFile falls back to opening files one at a time, which
				// preserves per-file error isolation.
				for (const filePath of newFilePaths) {
					currentSessionState.openFiles.delete(filePath);
				}
				currentSessionState.prepared = false;
			}
			return true;
		}

		return {
			createFile,
			prepareFiles,
			[Symbol.dispose]: () => {
				if (disposed) {
					return;
				}
				disposed = true;
				sessionState?.session[Symbol.dispose]();
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

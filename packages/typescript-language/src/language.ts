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
	Symbol as TSSymbol,
	Type,
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
import { createNodeVisitorsForFile } from "./createNodeVisitorsForFile.ts";
import {
	createTypeScriptProjectSession,
	type TypeScriptProjectSession,
} from "./createTypeScriptProjectSession.ts";
import { parseDirectivesFromTypeScriptFile } from "./directives/parseDirectivesFromTypeScriptFile.ts";
import { getTypeScriptDiagnostics } from "./getTypeScriptDiagnostics.ts";
import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";
import type { TypeScriptNodesByName, TypeScriptNodeVisitors } from "./nodes.ts";
import { NodeSyntaxKinds } from "./nodeSyntaxKinds.ts";
import { orderTypeScriptFilePaths } from "./orderTypeScriptFilePaths.ts";
import type * as AST from "./types/ast.ts";
import type { TypeScriptFileServices } from "./types/services.ts";

export type { TypeScriptFileServices } from "./types/services.ts";

const log = debugForFile(import.meta.filename);

// The native checker runs out-of-process, so every `getTypeAtLocation` /
// `getSymbolAtLocation` is an IPC round-trip. Many type-aware rules query the
// same node, so memoizing per node (per snapshot's checker, keyed by node
// identity) collapses those repeats to one round-trip. Results are stable while
// the snapshot is unchanged, which it is for the whole visitor phase.
const memoizedCheckerCache = new WeakMap<Checker, Checker>();

// Checker queries that are deterministic given a single Type/Symbol argument
// (for a stable snapshot), so results can be memoized by that argument's identity.
const firstArgIdentityMethods: ReadonlySet<string> = new Set([
	"getApparentType",
	"getBaseConstraintOfType",
	"getTypeArguments",
	"getTypeOfSymbol",
	"isArrayType",
	"isTupleType",
]);

function getMemoizedChecker(checker: Checker): Checker {
	const existing = memoizedCheckerCache.get(checker);
	if (existing) {
		return existing;
	}
	const typeByNode = new WeakMap<object, Type>();
	const symbolByNode = new WeakMap<object, TSSymbol | undefined>();
	const singleArgCaches: Record<string, WeakMap<object, unknown>> = {};
	const rawGetTypeAtLocation = checker.getTypeAtLocation;
	const rawGetSymbolAtLocation = checker.getSymbolAtLocation;
	const wrapped = new Proxy(checker, {
		get(target, property, receiver) {
			if (property === "getTypeAtLocation") {
				return (node: NativeNode | readonly NativeNode[]): unknown => {
					if (Array.isArray(node)) {
						return rawGetTypeAtLocation(node);
					}
					const key = node as object;
					const cached = typeByNode.get(key);
					if (cached !== undefined) {
						return cached;
					}
					const result = rawGetTypeAtLocation(node as NativeNode);
					typeByNode.set(key, result);
					return result;
				};
			}
			if (property === "getSymbolAtLocation") {
				return (node: NativeNode | readonly NativeNode[]): unknown => {
					if (Array.isArray(node)) {
						return rawGetSymbolAtLocation(node);
					}
					const key = node as object;
					if (symbolByNode.has(key)) {
						return symbolByNode.get(key);
					}
					const result = rawGetSymbolAtLocation(node as NativeNode);
					symbolByNode.set(key, result);
					return result;
				};
			}
			// Other frequently-called checker queries that are deterministic given a
			// single Type/Symbol argument (per stable snapshot) are memoized by that
			// argument's identity too, to cut their IPC round-trips.
			if (firstArgIdentityMethods.has(property as string)) {
				const cache = (singleArgCaches[property as string] ??= new WeakMap());
				const raw = Reflect.get(target, property, receiver) as (
					arg: object,
				) => unknown;
				return (arg: object): unknown => {
					if (arg == null || typeof arg !== "object") {
						return raw(arg);
					}
					if (cache.has(arg)) {
						return cache.get(arg);
					}
					const result = raw(arg);
					cache.set(arg, result);
					return result;
				};
			}
			return Reflect.get(target, property, receiver) as unknown;
		},
	});
	memoizedCheckerCache.set(checker, wrapped);
	return wrapped;
}

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
				}
				return (cachedProject ??= nullThrows(
					currentSessionState.session.getProjectForFile(data.filePathAbsolute),
					`Could not find project for file: ${data.filePathAbsolute}`,
				));
			};
			const getSourceFile = (): AST.SourceFile => {
				const project = getProject();
				return (cachedSourceFile ??= nullThrows(
					project.program.getSourceFile(data.filePathAbsolute),
					`Could not retrieve source file for: ${data.filePathAbsolute}`,
				) as AST.SourceFile);
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
					return getMemoizedChecker(getProject().checker);
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
			if (disposed || failed || filePathsAbsolute.length === 0) {
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
			if (newFilePaths.length === 0) {
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

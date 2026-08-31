import path from "node:path";

import { debugForFile } from "debug-for-file";
import {
	SyntaxKind,
	type Node as NativeNode,
	type SpanMap,
} from "typescript-native/unstable/ast";
import type {
	Checker,
	Program,
	Project,
	Snapshot,
} from "typescript-native/unstable/sync";

import {
	createLanguage,
	type AnyOptionalSchema,
	type FileAboutData,
	type InferredOutputObject,
	type Language,
	type LanguageFile,
	type LanguageFileDefinition,
	type LanguageReports,
	type RuleRuntime,
	type RuleVisitors,
} from "@flint.fyi/core";
import { assert, nullThrows } from "@flint.fyi/utils";

import packageJson from "../package.json" with { type: "json" };
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
	typeChecker: Checker;
}

const log = debugForFile(import.meta.filename);

export const NodeSyntaxKinds: typeof SyntaxKind =
	getFirstEnumValues(SyntaxKind);

interface GlobalLanguageState {
	packageVersion: string;
	volarCreateFile: null | VolarCreateFile;
}

type VolarCreateFile = (
	data: FileAboutData,
	unsupportedLegacyProgram: never,
	sourceFile: AST.SourceFile,
) => VolarLanguageFileDefinition;
type VolarLanguageFileDefinition =
	LanguageFileDefinition<TypeScriptFileServices> & {
		__volarServices: {
			getLanguageReports(): LanguageReports;
			runVisitors(
				file: LanguageFile<TypeScriptFileServices>,
				options: InferredOutputObject<AnyOptionalSchema | undefined>,
				runtime: RuleRuntime<TypeScriptNodeVisitors, TypeScriptFileServices>,
			): void;
		};
	};

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
		visitors[`${key}:exit`]?.(node, services);
	};

	visit(sourceFile);
}

const stateSymbol = Symbol.for("@flint.fyi/typescript-language/state");

const globalTyped = globalThis as typeof globalThis & {
	[stateSymbol]?: GlobalLanguageState;
};

assert(
	globalTyped[stateSymbol] == null,
	`Two different versions of ${packageJson.name} are imported: ${packageJson.version} and ${globalTyped[stateSymbol]?.packageVersion}`,
);

const languageState: GlobalLanguageState = (globalTyped[stateSymbol] = {
	packageVersion: packageJson.version,
	volarCreateFile: null,
});

export function setVolarCreateFile(create: VolarCreateFile): void {
	assert(
		languageState.volarCreateFile == null,
		"setVolarCreateFile is expected to be called only once",
	);
	languageState.volarCreateFile = create;
}

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
		let batch:
			| undefined
			| {
					activeFiles: number;
					disposed: boolean;
					openFiles: string[];
					session: TypeScriptProjectSession;
			  };
		let failed = false;
		const disposeSession = (currentBatch: NonNullable<typeof batch>): void => {
			if (currentBatch.disposed) {
				return;
			}
			currentBatch.disposed = true;
			currentBatch.session[Symbol.dispose]();
		};
		const disposeSessionForFailure = (
			currentBatch: NonNullable<typeof batch>,
		): undefined | { disposalError: unknown } => {
			try {
				disposeSession(currentBatch);
			} catch (disposalError) {
				return { disposalError };
			}
		};
		const failSession = (
			currentBatch: NonNullable<typeof batch>,
			error: unknown,
		): never => {
			failed = true;
			const disposalFailure = disposeSessionForFailure(currentBatch);
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
			if (failed) {
				throw new Error("TypeScript project session has been disposed.");
			}
			const currentBatch = (batch ??= {
				activeFiles: 0,
				disposed: false,
				openFiles: [],
				session: createTypeScriptProjectSession(host),
			});

			log("Opening native file:", data.filePathAbsolute);
			currentBatch.openFiles.push(data.filePathAbsolute);
			try {
				currentBatch.session.update({ openFiles: [...currentBatch.openFiles] });
			} catch (error) {
				return failSession(currentBatch, error);
			}
			let fileDisposed = false;

			const getSnapshot = (): Snapshot => {
				if (currentBatch.disposed) {
					throw new Error("TypeScript project session has been disposed.");
				}
				return currentBatch.session.getSnapshot();
			};
			const getProject = (): Project =>
				nullThrows(
					getSnapshot().getDefaultProjectForFile(data.filePathAbsolute),
					`Could not find default project for file: ${data.filePathAbsolute}`,
				);
			const getSourceFile = (): AST.SourceFile =>
				nullThrows(
					getProject().program.getSourceFile(data.filePathAbsolute),
					`Could not retrieve source file for: ${data.filePathAbsolute}`,
				);
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
				get typeChecker() {
					return getProject().checker;
				},
			};
			const dispose = (): void => {
				if (fileDisposed) {
					return;
				}
				fileDisposed = true;
				currentBatch.activeFiles -= 1;
				if (currentBatch.activeFiles === 0) {
					disposeSession(currentBatch);
					if (batch === currentBatch) {
						batch = undefined;
					}
				}
			};
			try {
				const sourceFile = getSourceFile();
				const fileExtension = path.extname(data.filePathAbsolute);
				if (typeScriptCoreSupportedExtensions.has(fileExtension)) {
					const file = {
						...parseDirectivesFromTypeScriptFile(sourceFile),
						about: data,
						language: typescriptLanguage,
						services,
						[Symbol.dispose]: dispose,
					};
					currentBatch.activeFiles += 1;
					return file;
				}

				if (languageState.volarCreateFile == null) {
					throwUnknownLanguageExtension(data.filePathAbsolute);
				}

				throw new Error(
					`Cannot process ${data.filePathAbsolute} until Volar supports the native TypeScript project session.`,
				);
			} catch (error) {
				return failSession(currentBatch, error);
			}
		}

		return { createFile };
	},

	getFileCacheImpacts: getTypeScriptFileCacheImpacts,
	getLanguageReports(file) {
		if ("__volarServices" in file) {
			return (
				file as VolarLanguageFileDefinition
			).__volarServices.getLanguageReports();
		}
		return getTypeScriptDiagnostics(
			file.services.program,
			file.services.sourceFile.fileName,
		).map(convertTypeScriptDiagnosticToLanguageReport);
	},
	orderFilePaths: orderTypeScriptFilePaths,
	runFileVisitors(file, options, runtime) {
		if (!runtime.visitors) {
			return;
		}

		if ("__volarServices" in file) {
			(file as VolarLanguageFileDefinition).__volarServices.runVisitors(
				file,
				options,
				runtime,
			);
			return;
		}

		const { visitors } = runtime;
		const visitorServices = { options, ...file.services };

		visitTypeScriptNodes(file.services.sourceFile, visitors, visitorServices);
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

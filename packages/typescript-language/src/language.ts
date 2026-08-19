import path from "node:path";

import { createProjectService } from "@typescript-eslint/project-service";
import { debugForFile } from "debug-for-file";
import { dirname, join } from "pathe";
import {
	getPreEmitDiagnostics,
	SyntaxKind,
	type Node,
	type Program,
	type server,
} from "typescript";

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
} from "@flint.fyi/core";
import { assert, nullThrows, pathKey, type PathKey } from "@flint.fyi/utils";

import packageJson from "../package.json" with { type: "json" };
import { convertTypeScriptDiagnosticToLanguageReport } from "./convertTypeScriptDiagnosticToLanguageReport.ts";
import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
import { parseDirectivesFromTypeScriptFile } from "./directives/parseDirectivesFromTypeScriptFile.ts";
import { getFirstEnumValues } from "./getFirstEnumValues.ts";
import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";
import type { TypeScriptNodesByName, TypeScriptNodeVisitors } from "./nodes.ts";
import { orderTypeScriptFilePaths } from "./orderTypeScriptFilePaths.ts";
import type * as AST from "./types/ast.ts";
import type { Checker } from "./types/checker.ts";

export interface TypeScriptFileServices {
	program: Program;
	sourceFile: AST.SourceFile;
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
	program: Program,
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
		const serverHost = createTypeScriptServerHost(host);
		const { service } = createProjectService({ host: serverHost });

		const caseSensitiveFS = host.isCaseSensitiveFS();
		const configPathsByDirectory = new Map<PathKey, string | undefined>();
		const openedFilePaths = new Set<string>();
		const projectsByConfigPath = new Map<PathKey, server.Project>();

		function findConfigPath(directory: string): string | undefined {
			const directoryKey = pathKey(directory, caseSensitiveFS);
			if (configPathsByDirectory.has(directoryKey)) {
				return configPathsByDirectory.get(directoryKey);
			}

			const configPath = join(directory, "tsconfig.json");
			const parentDirectory = dirname(directory);
			const found = serverHost.fileExists(configPath)
				? configPath
				: parentDirectory === directory
					? undefined
					: findConfigPath(parentDirectory);

			configPathsByDirectory.set(directoryKey, found);
			return found;
		}

		function getProgram(filePathAbsolute: string) {
			const configPath = findConfigPath(dirname(filePathAbsolute));
			const configPathKey =
				configPath == null ? undefined : pathKey(configPath, caseSensitiveFS);

			// Files are only reused into an already-open project when they'd resolve
			// to it anyway: the project owns their closest tsconfig.json and its
			// program already contains them. Re-opening a file that was opened
			// before lets the service pick up any change to its text.
			if (configPathKey && !openedFilePaths.has(filePathAbsolute)) {
				const program = projectsByConfigPath
					.get(configPathKey)
					?.getLanguageService(true)
					.getProgram();
				if (program?.getSourceFile(filePathAbsolute)) {
					return program;
				}
			}

			log("Opening client file:", filePathAbsolute);
			const { configFileName } = service.openClientFile(filePathAbsolute);
			openedFilePaths.add(filePathAbsolute);

			log("Retrieving client services:", filePathAbsolute);
			const scriptInfo = nullThrows(
				service.getScriptInfo(filePathAbsolute),
				`Could not find script info for file: ${filePathAbsolute}`,
			);

			const defaultProject = nullThrows(
				service.getDefaultProjectForFile(scriptInfo.fileName, true),
				`Could not find default project for file: ${filePathAbsolute}`,
			);

			if (
				configPathKey &&
				configFileName &&
				pathKey(configFileName, caseSensitiveFS) === configPathKey
			) {
				projectsByConfigPath.set(configPathKey, defaultProject);
			}

			return nullThrows(
				defaultProject.getLanguageService(true).getProgram(),
				`Could not retrieve program for file: ${filePathAbsolute}`,
			);
		}

		function createFile(data: FileAboutData) {
			const program = getProgram(data.filePathAbsolute);

			const sourceFile = nullThrows(
				program.getSourceFile(data.filePathAbsolute),
				`Could not retrieve source file for: ${data.filePathAbsolute}`,
			);

			const fileExtension = path.extname(data.filePathAbsolute);
			if (typeScriptCoreSupportedExtensions.has(fileExtension)) {
				return {
					...parseDirectivesFromTypeScriptFile(sourceFile as AST.SourceFile),
					about: data,
					language: typescriptLanguage,
					services: {
						program,
						sourceFile: sourceFile as AST.SourceFile,
						// ew, I don't like this. the ts -> AST type story is not great
						typeChecker: program.getTypeChecker() as unknown as Checker,
					},
					[Symbol.dispose]() {
						closeFile(data.filePathAbsolute);
					},
				};
			}

			if (languageState.volarCreateFile == null) {
				throwUnknownLanguageExtension(data.filePathAbsolute);
			}

			return {
				...languageState.volarCreateFile(
					data,
					program,
					sourceFile as AST.SourceFile,
				),
				[Symbol.dispose]() {
					closeFile(data.filePathAbsolute);
				},
			};
		}

		function closeFile(filePathAbsolute: string) {
			if (openedFilePaths.has(filePathAbsolute)) {
				service.closeClientFile(filePathAbsolute);
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
		return getPreEmitDiagnostics(
			file.services.program,
			file.services.sourceFile,
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

		const visit = (node: Node) => {
			const key = NodeSyntaxKinds[node.kind] as keyof TypeScriptNodesByName;

			// @ts-expect-error -- The node parameter type shouldn't be `never`...?
			visitors[key]?.(node, visitorServices);

			node.forEachChild(visit);

			// @ts-expect-error -- The node parameter type shouldn't be `never`...?
			visitors[`${key}:exit`]?.(node, visitorServices);
		};

		visit(file.services.sourceFile);
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

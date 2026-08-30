import path from "node:path";

import { createProjectService } from "@typescript-eslint/project-service";
import { debugForFile } from "debug-for-file";
import {
	getPreEmitDiagnostics,
	type Program as LegacyProgram,
} from "typescript";
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
import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
import { parseDirectivesFromTypeScriptFile } from "./directives/parseDirectivesFromTypeScriptFile.ts";
import { getFirstEnumValues } from "./getFirstEnumValues.ts";
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
	spanMap?: SpanMap;
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
	program: LegacyProgram,
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
		const { service } = createProjectService({
			host: createTypeScriptServerHost(host),
		});

		function createFile(data: FileAboutData) {
			log("Opening client file:", data.filePathAbsolute);
			service.openClientFile(data.filePathAbsolute);

			log("Retrieving client services:", data.filePathAbsolute);
			const scriptInfo = nullThrows(
				service.getScriptInfo(data.filePathAbsolute),
				`Could not find script info for file: ${data.filePathAbsolute}`,
			);

			const defaultProject = nullThrows(
				service.getDefaultProjectForFile(scriptInfo.fileName, true),
				`Could not find default project for file: ${data.filePathAbsolute}`,
			);

			const program = nullThrows(
				defaultProject.getLanguageService(true).getProgram(),
				`Could not retrieve program for file: ${data.filePathAbsolute}`,
			);

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
						service.closeClientFile(data.filePathAbsolute);
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
					service.closeClientFile(data.filePathAbsolute);
				},
			};
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

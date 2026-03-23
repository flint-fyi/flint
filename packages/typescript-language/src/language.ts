import {
	type AnyOptionalSchema,
	createLanguage,
	type FileAboutData,
	type InferredOutputObject,
	type LanguageFile,
	type LanguageFileDefinition,
	type LanguageReports,
	type RuleRuntime,
} from "@flint.fyi/core";
import { assert, nullThrows } from "@flint.fyi/utils";
import { createProjectService } from "@typescript-eslint/project-service";
import { debugForFile } from "debug-for-file";
import path from "node:path";
import * as ts from "typescript";

import packageJson from "../package.json" with { type: "json" };
import { convertTypeScriptDiagnosticToLanguageReport } from "./convertTypeScriptDiagnosticToLanguageReport.ts";
import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
import { parseDirectivesFromTypeScriptFile } from "./directives/parseDirectivesFromTypeScriptFile.ts";
import { getFirstEnumValues } from "./getFirstEnumValues.ts";
import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";
import type { TypeScriptNodesByName, TypeScriptNodeVisitors } from "./nodes.ts";
import type * as AST from "./types/ast.ts";
import type { Checker } from "./types/checker.ts";

export interface TypeScriptFileServices {
	program: ts.Program;
	sourceFile: AST.SourceFile;
	typeChecker: Checker;
}

const log = debugForFile(import.meta.filename);

export const NodeSyntaxKinds = getFirstEnumValues(ts.SyntaxKind);

interface GlobalLanguageState {
	packageVersion: string;
	volarCreateFile: null | VolarCreateFile;
}
type VolarCreateFile = (
	data: FileAboutData,
	program: ts.Program,
	sourceFile: AST.SourceFile,
) => VolarLanguageFileDefinition;

type VolarLanguageFileDefinition = LanguageFileDefinition<object> & {
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

export function setVolarCreateFile(create: VolarCreateFile) {
	assert(
		languageState.volarCreateFile == null,
		"setVolarCreateFile is expected to be called only once",
	);
	languageState.volarCreateFile = create;
}

export const typescriptLanguage = createLanguage<
	TypeScriptNodeVisitors,
	TypeScriptFileServices
>({
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
						sourceFile,
						typeChecker: program.getTypeChecker(),
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
		return ts
			.getPreEmitDiagnostics(file.services.program, file.services.sourceFile)
			.map(convertTypeScriptDiagnosticToLanguageReport);
	},
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

		const visit = (node: ts.Node) => {
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

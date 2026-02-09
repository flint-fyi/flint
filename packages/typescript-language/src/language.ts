import {
	createLanguage,
	type FileAboutData,
	type InferredOutputObject,
	type LanguageDiagnostics,
	type LanguageFile,
	type LanguageFileDefinition,
	type RuleRuntime,
} from "@flint.fyi/core";
import { assert } from "@flint.fyi/utils";
import { createProjectService } from "@typescript-eslint/project-service";
import { debugForFile } from "debug-for-file";
import path from "node:path";
import * as ts from "typescript";

import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
import { parseDirectivesFromTypeScriptFile } from "./directives/parseDirectivesFromTypeScriptFile.ts";
import { getFirstEnumValues } from "./getFirstEnumValues.ts";
import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";
import type { TypeScriptNodesByName } from "./nodes.ts";
import type * as AST from "./types/ast.ts";
import type { Checker } from "./types/checker.ts";
import packageJson from "../package.json" with { type: "json" };
import { convertTypeScriptDiagnosticToLanguageFileDiagnostic } from "./convertTypeScriptDiagnosticToLanguageFileDiagnostic.ts";

export interface TypeScriptFileServices {
	program: ts.Program;
	sourceFile: AST.SourceFile;
	typeChecker: Checker;
}

const log = debugForFile(import.meta.filename);

export const NodeSyntaxKinds = getFirstEnumValues(ts.SyntaxKind);

type VolarLanguageFileDefinition = LanguageFileDefinition<any> & {
	__volarServices: {
		getDiagnostics(): LanguageDiagnostics;
		runVisitors(
			file: LanguageFile<any>,
			options: InferredOutputObject<any>,
			runtime: RuleRuntime<any, any>,
		): void;
	};
};
type VolarCreateFile = (
	data: FileAboutData,
	program: ts.Program,
	sourceFile: AST.SourceFile,
) => VolarLanguageFileDefinition;

type GlobalLanguageState = {
	packageVersion: string;
	volarCreateFile: VolarCreateFile | null;
};
const globalTyped = globalThis as typeof globalThis & {
	_flintTypeScriptLanguageState?: GlobalLanguageState;
};

assert(
	globalTyped._flintTypeScriptLanguageState == null,
	`Two different versions of ${packageJson.name} are imported: ${packageJson.version} and ${globalTyped._flintTypeScriptLanguageState?.packageVersion}`,
);

const languageState: GlobalLanguageState =
	(globalTyped._flintTypeScriptLanguageState = {
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
	TypeScriptNodesByName,
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
			const scriptInfo = service.getScriptInfo(data.filePathAbsolute);
			assert(
				scriptInfo != null,
				`Could not find script info for file: ${data.filePathAbsolute}`,
			);

			const defaultProject = service.getDefaultProjectForFile(
				scriptInfo.fileName,
				true,
			);
			assert(
				defaultProject != null,
				`Could not find default project for file: ${data.filePathAbsolute}`,
			);

			const program = defaultProject.getLanguageService(true).getProgram();
			assert(
				program != null,
				`Could not retrieve program for file: ${data.filePathAbsolute}`,
			);

			const sourceFile = program.getSourceFile(data.filePathAbsolute);
			assert(
				sourceFile != null,
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

				throw new Error(`Cannot process ${sourceFile.fileName}. ${message}`);
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
	getFileDiagnostics(file) {
		if ("__volarServices" in file) {
			return (
				file as VolarLanguageFileDefinition
			).__volarServices.getDiagnostics();
		}
		return ts
			.getPreEmitDiagnostics(file.services.program, file.services.sourceFile)
			.map(convertTypeScriptDiagnosticToLanguageFileDiagnostic);
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
			// @ts-expect-error - This should work...?
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			visitors[NodeSyntaxKinds[node.kind]]?.(node, visitorServices);
			node.forEachChild(visit);
		};

		visit(file.services.sourceFile);
	},
});

const typeScriptCoreSupportedExtensions: ReadonlySet<string> = new Set([
	".ts",
	".tsx",
	".d.ts",
	".js",
	".jsx",
	".cts",
	".d.cts",
	".cjs",
	".mts",
	".d.mts",
	".mjs",
	".json",
]);

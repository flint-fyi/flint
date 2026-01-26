import { createLanguage, type FileAboutData } from "@flint.fyi/core";
import { assert } from "@flint.fyi/utils";
import { createProjectService } from "@typescript-eslint/project-service";
import { debugForFile } from "debug-for-file";
import * as ts from "typescript";

import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
import { parseDirectivesFromTypeScriptFile } from "./directives/parseDirectivesFromTypeScriptFile.ts";
import { getFirstEnumValues } from "./getFirstEnumValues.ts";
import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";
import { getTypeScriptFileDiagnostics } from "./getTypeScriptFileDiagnostics.ts";
import type { TypeScriptNodesByName } from "./nodes.ts";
import type * as AST from "./types/ast.ts";
import type { Checker } from "./types/checker.ts";

export interface TypeScriptFileServices {
	program: ts.Program;
	sourceFile: AST.SourceFile;
	typeChecker: Checker;
}

const log = debugForFile(import.meta.filename);

const NodeSyntaxKinds = getFirstEnumValues(ts.SyntaxKind);

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

		return { createFile };
	},

	getFileCacheImpacts: getTypeScriptFileCacheImpacts,
	getFileDiagnostics: getTypeScriptFileDiagnostics,
	runFileVisitors(file, options, runtime) {
		if (!runtime.visitors) {
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

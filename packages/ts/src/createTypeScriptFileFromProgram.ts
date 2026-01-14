import type {
	FileAboutData,
	LanguageFileCacheImpacts,
	LanguageFileDefinition,
} from "@flint.fyi/core";
import ts, { SyntaxKind } from "typescript";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import { convertTypeScriptDiagnosticToLanguageFileDiagnostic } from "./convertTypeScriptDiagnosticToLanguageFileDiagnostic.ts";
import { getFirstEnumValues } from "./getFirstEnumValues.ts";
import type { TypeScriptFileServices } from "./language.ts";
import type { TypeScriptNodesByName } from "./nodes.ts";

export const NodeSyntaxKinds = getFirstEnumValues(SyntaxKind);

export function collectTypeScriptFileCacheImpacts(
	program: ts.Program,
	sourceFile: ts.SourceFile,
): LanguageFileCacheImpacts {
	return {
		dependencies: [
			// TODO: Add support for multi-TSConfig workspaces.
			// https://github.com/flint-fyi/flint/issues/64 & more.
			"tsconfig.json",

			...collectReferencedFilePaths(program, sourceFile),
		],
	};
}

export function createTypeScriptFileFromProgram(
	data: FileAboutData,
	program: ts.Program,
	sourceFile: ts.SourceFile,
): LanguageFileDefinition<TypeScriptNodesByName, TypeScriptFileServices> {
	return {
		about: {
			...data,
			sourceText: sourceFile.text,
		},
		cache: collectTypeScriptFileCacheImpacts(program, sourceFile),
		getDiagnostics() {
			return ts
				.getPreEmitDiagnostics(program, sourceFile)
				.map(convertTypeScriptDiagnosticToLanguageFileDiagnostic);
		},
		runVisitors(options, runtime) {
			if (!runtime.visitors) {
				return;
			}

			const { visitors } = runtime;
			const typeChecker = program.getTypeChecker();
			const fileServices = { options, program, sourceFile, typeChecker };

			const visit = (node: ts.Node) => {
				// @ts-expect-error - This should work...?
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				visitors[NodeSyntaxKinds[node.kind]]?.(node, fileServices);
				node.forEachChild(visit);
			};

			visit(sourceFile);
		},
	};
}

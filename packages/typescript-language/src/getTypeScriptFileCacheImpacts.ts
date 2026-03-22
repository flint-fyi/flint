import type { LanguageFile, LanguageFileCacheImpacts } from "@flint.fyi/core";
import type ts from "typescript";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import type { TypeScriptFileServices } from "./language.ts";

export function getTypeScriptFileCacheImpacts(
	host: ts.ModuleResolutionHost,
	file: LanguageFile<TypeScriptFileServices>,
): LanguageFileCacheImpacts {
	return {
		dependencies: [
			// TODO: Add support for multi-TSConfig workspaces.
			// https://github.com/flint-fyi/flint/issues/64 & more.
			"tsconfig.json",

			...collectReferencedFilePaths(
				host,
				file.services.program,
				file.services.sourceFile,
			),
		],
	};
}

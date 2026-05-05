import type { LanguageFile, LanguageFileCacheImpacts } from "@flint.fyi/core";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import type { TypeScriptFileServices } from "./language.ts";

export function getTypeScriptFileCacheImpacts(
	file: LanguageFile<TypeScriptFileServices>,
): LanguageFileCacheImpacts {
	return {
		dependencies: [
			// TODO: Add support for multi-TSConfig workspaces.
			// https://github.com/flint-fyi/flint/issues/64 & more.
			"tsconfig.json",

			...collectReferencedFilePaths(
				file.services.program,
				file.services.sourceFile,
			),
		],
	};
}

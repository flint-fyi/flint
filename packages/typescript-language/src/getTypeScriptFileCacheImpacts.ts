import type {
	LanguageFile,
	LanguageFileCacheImpacts,
	LinterHost,
} from "@flint.fyi/core";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
import type { TypeScriptFileServices } from "./types/services.ts";
import { containsGlobalDeclarations } from "./utils/containsGlobalDeclarations.ts";

export function getTypeScriptFileCacheImpacts(
	file: LanguageFile<TypeScriptFileServices>,
	host: LinterHost,
): LanguageFileCacheImpacts {
	return {
		dependencies: [
			// TODO: Add support for multi-TSConfig workspaces.
			// https://github.com/flint-fyi/flint/issues/64 & more.
			"tsconfig.json",

			...collectReferencedFilePaths(
				file.services.program,
				file.services.sourceFile,
				createTypeScriptServerHost(host),
			),
		],
		invalidatesCache: containsGlobalDeclarations(file.services.sourceFile),
	};
}

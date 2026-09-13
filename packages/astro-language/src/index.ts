import { registerTypeScriptContentMapper } from "@flint.fyi/typescript-language";

import { createAstroFileContext } from "./language.ts";

let unregisterContentMapper = registerContentMapper(
	"@flint.fyi/astro-language",
);

export function registerAstroTypeScriptContentMapper(
	packageName: string,
): void {
	unregisterContentMapper();
	unregisterContentMapper = registerContentMapper(packageName);
}

function registerContentMapper(packageName: string): () => boolean {
	return registerTypeScriptContentMapper({
		createFile: ({ sourceText }) => createAstroFileContext(sourceText),
		extensions: [".astro"],
		packageName,
	});
}

export { astroLanguage, type AstroServices } from "./language.ts";

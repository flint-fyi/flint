import { registerTypeScriptContentMapper } from "@flint.fyi/typescript-language";

import { createAstroFileContext } from "./language.ts";

registerTypeScriptContentMapper({
	createFile: ({ sourceText }) => createAstroFileContext(sourceText),
	extensions: [".astro"],
	packageName: "@flint.fyi/astro-language",
});

export { astroLanguage, type AstroServices } from "./language.ts";

import { createContentMapperRegistrar } from "@flint.fyi/typescript-language";

import { createAstroFileContext } from "./language.ts";

export const registerAstroTypeScriptContentMapper: (
	packageName: string,
) => void = createContentMapperRegistrar({
	createFile: ({ sourceText }) => createAstroFileContext(sourceText),
	extensions: [".astro"],
	packageName: "@flint.fyi/astro-language",
});

export { getAstroPointOffset } from "./getAstroPointOffset.ts";
export { astroLanguage, type AstroServices } from "./language.ts";

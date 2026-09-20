import { createContentMapperRegistrar } from "@flint.fyi/typescript-language";

import { createSvelteFileContext } from "./language.ts";

export const registerSvelteTypeScriptContentMapper: (
	packageName: string,
) => void = createContentMapperRegistrar({
	createFile: ({ about, sourceText }) =>
		createSvelteFileContext(about.filePath, sourceText),
	extensions: [".svelte"],
	packageName: "@flint.fyi/svelte-language",
});

export { svelteLanguage, type SvelteServices } from "./language.ts";

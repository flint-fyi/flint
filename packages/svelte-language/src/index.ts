import { createContentMapperRegistrar } from "@flint.fyi/typescript-language";

import { createSvelteFileContext } from "./language.ts";
import { svelteConfigFileNames } from "./svelteConfigFileNames.ts";

export const registerSvelteTypeScriptContentMapper: (
	packageName: string,
) => void = createContentMapperRegistrar({
	configFileNames: svelteConfigFileNames,
	createFile: ({ about, sourceText }) =>
		createSvelteFileContext(about.filePath, sourceText),
	extensions: [".svelte"],
	packageName: "@flint.fyi/svelte-language",
});

export { svelteLanguage, type SvelteServices } from "./language.ts";

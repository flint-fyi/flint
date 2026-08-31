import { registerTypeScriptContentMapper } from "@flint.fyi/typescript-language";

import { createSvelteFileContext } from "./language.ts";

registerTypeScriptContentMapper({
	createFile: ({ sourceText }) => createSvelteFileContext(sourceText),
	extensions: [".svelte"],
	packageName: "@flint.fyi/svelte-language",
});

export { svelteLanguage, type SvelteServices } from "./language.ts";

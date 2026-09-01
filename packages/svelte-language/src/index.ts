import { registerTypeScriptContentMapper } from "@flint.fyi/typescript-language";

import { createSvelteFileContext } from "./language.ts";

let unregisterContentMapper = registerContentMapper(
	"@flint.fyi/svelte-language",
);

export function registerSvelteTypeScriptContentMapper(
	packageName: string,
): void {
	unregisterContentMapper();
	unregisterContentMapper = registerContentMapper(packageName);
}

function registerContentMapper(packageName: string): () => boolean {
	return registerTypeScriptContentMapper({
		createFile: ({ sourceText }) => createSvelteFileContext(sourceText),
		extensions: [".svelte"],
		packageName,
	});
}

export { svelteLanguage, type SvelteServices } from "./language.ts";

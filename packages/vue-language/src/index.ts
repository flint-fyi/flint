import { registerTypeScriptContentMapper } from "@flint.fyi/typescript-language";

import { createVueFileContext } from "./language.ts";

let unregisterContentMapper = registerContentMapper("vize");

export function registerVueTypeScriptContentMapper(packageName: string): void {
	unregisterContentMapper();
	unregisterContentMapper = registerContentMapper(packageName);
}

function registerContentMapper(packageName: string): () => boolean {
	return registerTypeScriptContentMapper({
		createFile: ({ about, sourceText }) =>
			createVueFileContext(about.filePath, sourceText),
		extensions: [".vue"],
		packageName,
	});
}

export { vueLanguage, type VueServices } from "./language.ts";

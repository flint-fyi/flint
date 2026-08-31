import { registerTypeScriptContentMapper } from "@flint.fyi/typescript-language";

import { createVueFileContext } from "./language.ts";

registerTypeScriptContentMapper({
	createFile: ({ about, sourceText }) =>
		createVueFileContext(about.filePath, sourceText),
	extensions: [".vue"],
	packageName: "vize",
});

export { vueLanguage, type VueServices } from "./language.ts";

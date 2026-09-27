import { createContentMapperRegistrar } from "@flint.fyi/typescript-language";

import { createVueFileContext } from "./language.ts";

export const registerVueTypeScriptContentMapper: (packageName: string) => void =
	createContentMapperRegistrar({
		createFile: ({ about, sourceText }) =>
			createVueFileContext(about.filePath, sourceText),
		extensions: [".vue"],
		packageName: "@flint.fyi/vue-language",
	});

export { vueLanguage, type VueServices } from "./language.ts";

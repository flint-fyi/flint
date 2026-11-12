import { createPlugin } from "@flint.fyi/core";
import { registerSvelteTypeScriptContentMapper } from "@flint.fyi/svelte-language";
import { ts } from "@flint.fyi/ts";

import rawSpecialElements from "./rules/rawSpecialElements.ts";

registerSvelteTypeScriptContentMapper("@flint.fyi/svelte");

export const svelte = createPlugin({
	files: {
		all: [ts.files.all, "**/*.svelte"],
	},
	name: "Svelte",
	rules: [rawSpecialElements],
});

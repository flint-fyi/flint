import { createPlugin } from "@flint.fyi/core";
import { ts } from "@flint.fyi/ts";

import rawSpecialElements from "./rules/rawSpecialElements.ts";

export const svelte = createPlugin({
	files: {
		all: [ts.files.all, "**/*.svelte"],
	},
	name: "Svelte",
	rules: [rawSpecialElements],
});

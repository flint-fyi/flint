import { createPlugin } from "@flint.fyi/core";
import { ts } from "@flint.fyi/ts";
import { registerVueTypeScriptContentMapper } from "@flint.fyi/vue-language";

import vForKeys from "./rules/vForKeys.ts";

registerVueTypeScriptContentMapper("@flint.fyi/vue");

export const vue = createPlugin({
	files: {
		all: [ts.files.all, "**/*.vue"],
	},
	name: "Vue.js",
	rules: [vForKeys],
});

import { createPlugin } from "@flint.fyi/core";

import vForKeys from "./rules/vForKeys.ts";
import { ts } from "@flint.fyi/ts";

export const vue = createPlugin({
	files: {
		all: [ts.files.all, "**/*.vue"],
	},
	name: "Vue.js",
	rules: [vForKeys],
});

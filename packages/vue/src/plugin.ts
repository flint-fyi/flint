import { createPlugin } from "@flint.fyi/core";
import { ts } from "@flint.fyi/ts";

import vForKeys from "./rules/vForKeys.ts";

export const vue = createPlugin({
	files: {
		all: [ts.files.all, "**/*.vue"],
	},
	name: "Vue.js",
	rules: [vForKeys],
});

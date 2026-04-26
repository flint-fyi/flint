import { createPlugin } from "@flint.fyi/core";
import { ts } from "@flint.fyi/ts";

import setHtmlDirectives from "./rules/setHtmlDirectives.ts";

export const astro = createPlugin({
	files: {
		all: [ts.files.all, "**/*.astro"],
	},
	name: "Astro",
	rules: [setHtmlDirectives],
});

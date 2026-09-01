import { registerAstroTypeScriptContentMapper } from "@flint.fyi/astro-language";
import { createPlugin } from "@flint.fyi/core";
import { ts } from "@flint.fyi/ts";

import clientOnlyDirectiveValues from "./rules/clientOnlyDirectiveValues.ts";
import setHtmlDirectives from "./rules/setHtmlDirectives.ts";

registerAstroTypeScriptContentMapper("@flint.fyi/astro");

export const astro = createPlugin({
	files: {
		all: [ts.files.all, "**/*.astro"],
	},
	name: "Astro",
	rules: [clientOnlyDirectiveValues, setHtmlDirectives],
});

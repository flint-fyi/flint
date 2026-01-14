import { createPlugin } from "@flint.fyi/core";

import cspell from "./rules/cspell.ts";

export const spelling = createPlugin({
	name: "Spelling",
	rules: [cspell],
});

// TODO: How do we appease TypeScript?!
// The inferred type of 'default' cannot be named without a reference to ...
export type * as language from "@flint.fyi/text-language";

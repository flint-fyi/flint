import { createPlugin } from "@flint.fyi/core";

import invalidCodeLines from "./rules/invalidCodeLines.ts";
import testCaseDuplicates from "./rules/testCaseDuplicates.ts";

export const flint = createPlugin({
	name: "Flint",
	rules: [invalidCodeLines, testCaseDuplicates],
});

// TODO: How do we appease TypeScript?!
// The inferred type of 'default' cannot be named without a reference to ...
export type * as language from "@flint.fyi/typescript-language";

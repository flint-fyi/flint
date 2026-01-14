import { createPlugin } from "@flint.fyi/core";

import invalidCodeLines from "./rules/invalidCodeLines.ts";
import missingPlaceholders from "./rules/missingPlaceholders.ts";
import testCaseDuplicates from "./rules/testCaseDuplicates.ts";

export const flint = createPlugin({
	name: "Flint",
	rules: [invalidCodeLines, testCaseDuplicates, missingPlaceholders],
});

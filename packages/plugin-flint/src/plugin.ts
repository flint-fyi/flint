import { createPlugin } from "@flint.fyi/core";

import getStartSourceFile from "./rules/getStartSourceFile.ts";
import invalidCodeLines from "./rules/invalidCodeLines.ts";
import missingPlaceholders from "./rules/missingPlaceholders.ts";
import nodePropertyInChecks from "./rules/nodePropertyInChecks.ts";
import testCaseDuplicates from "./rules/testCaseDuplicates.ts";
import testShorthands from "./rules/testShorthands.ts";

export const flint = createPlugin({
	name: "Flint",
	rules: [
		getStartSourceFile,
		invalidCodeLines,
		testCaseDuplicates,
		missingPlaceholders,
		testShorthands,
		nodePropertyInChecks,
	],
});

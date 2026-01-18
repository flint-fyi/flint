import { createPlugin } from "@flint.fyi/core";

import getStartSourceFile from "./rules/getStartSourceFile.ts";
import invalidCodeLines from "./rules/invalidCodeLines.ts";
import testCaseDuplicates from "./rules/testCaseDuplicates.ts";

export const flint = createPlugin({
	name: "Flint",
	rules: [getStartSourceFile, invalidCodeLines, testCaseDuplicates],
});

import { createPlugin } from "@flint.fyi/core";

import getStartSourceFile from "./rules/getStartSourceFile.ts";
import invalidCodeLines from "./rules/invalidCodeLines.ts";
import missingPlaceholders from "./rules/missingPlaceholders.ts";
import nodePropertyInChecks from "./rules/nodePropertyInChecks.ts";
import placeholderFormats from "./rules/placeholderFormats.ts";
import ruleCreationMethods from "./rules/ruleCreationMethods.ts";
import testCaseDuplicates from "./rules/testCaseDuplicates.ts";
import testCaseNameDuplicates from "./rules/testCaseNameDuplicates.ts";
import testCaseNonStaticCode from "./rules/testCaseNonStaticCode.ts";
import testShorthands from "./rules/testShorthands.ts";

export const flint = createPlugin({
	name: "Flint",
	rules: [
		getStartSourceFile,
		invalidCodeLines,
		testCaseNonStaticCode,
		testCaseDuplicates,
		testCaseNameDuplicates,
		missingPlaceholders,
		ruleCreationMethods,
		placeholderFormats,
		testShorthands,
		nodePropertyInChecks,
	],
});

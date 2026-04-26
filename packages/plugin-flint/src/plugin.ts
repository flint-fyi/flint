import { createPlugin } from "@flint.fyi/core";

import getStartSourceFile from "./rules/getStartSourceFile.ts";
import invalidCodeLines from "./rules/invalidCodeLines.ts";
import missingPlaceholders from "./rules/missingPlaceholders.ts";
import nodePropertyInChecks from "./rules/nodePropertyInChecks.ts";
import placeholderFormats from "./rules/placeholderFormats.ts";
import pluginRuleOrdering from "./rules/pluginRuleOrdering.ts";
import ruleCreationMethods from "./rules/ruleCreationMethods.ts";
import testCaseDuplicates from "./rules/testCaseDuplicates.ts";
import testCaseNameDuplicates from "./rules/testCaseNameDuplicates.ts";
import testCaseNonStaticCode from "./rules/testCaseNonStaticCode.ts";
import testShorthands from "./rules/testShorthands.ts";
import unusedMessageIds from "./rules/unusedMessageIds.ts";

export const flint = createPlugin({
	name: "Flint",
	rules: [
		getStartSourceFile,
		invalidCodeLines,
		missingPlaceholders,
		nodePropertyInChecks,
		placeholderFormats,
		pluginRuleOrdering,
		ruleCreationMethods,
		testCaseDuplicates,
		testCaseNameDuplicates,
		testCaseNonStaticCode,
		testShorthands,
		unusedMessageIds,
	],
});

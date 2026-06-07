import { configDefaults } from "vitest/config";

import { createPlugin } from "@flint.fyi/core";

import afterAllPaddingLines from "./rules/afterAllPaddingLines.ts";
import afterEachPaddingLines from "./rules/afterEachPaddingLines.ts";
import allPaddingLines from "./rules/allPaddingLines.ts";
import beforeAllPaddingLines from "./rules/beforeAllPaddingLines.ts";
import beforeEachPaddingLines from "./rules/beforeEachPaddingLines.ts";
import describePaddingLines from "./rules/describePaddingLines.ts";
import expectGroupPaddingLines from "./rules/expectGroupPaddingLines.ts";
import nodeTestImports from "./rules/nodeTestImports.ts";
import testCasePaddingLines from "./rules/testCasePaddingLines.ts";
import testCasesWithinDescribes from "./rules/testCasesWithinDescribes.ts";

export const vitest = createPlugin({
	files: {
		all: configDefaults.include,
	},
	name: "Vitest",
	rules: [
		afterAllPaddingLines,
		afterEachPaddingLines,
		allPaddingLines,
		beforeAllPaddingLines,
		beforeEachPaddingLines,
		describePaddingLines,
		expectGroupPaddingLines,
		nodeTestImports,
		testCasePaddingLines,
		testCasesWithinDescribes,
	],
});

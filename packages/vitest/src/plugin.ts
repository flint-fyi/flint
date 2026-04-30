import { createPlugin } from "@flint.fyi/core";
import { configDefaults } from "vitest/config";

import afterAllPaddingLines from "./rules/afterAllPaddingLines.ts";
import nodeTestImports from "./rules/nodeTestImports.ts";

export const vitest = createPlugin({
	files: {
		all: configDefaults.include,
	},
	name: "Vitest",
	rules: [afterAllPaddingLines, nodeTestImports],
});

import { createPlugin } from "@flint.fyi/core";
import { configDefaults } from "vitest/config";

import deletes from "./rules/nodeTestImports.ts";

export const vitest = createPlugin({
	files: {
		all: configDefaults.include,
	},
	name: "Vitest",
	rules: [deletes],
});

import { createPlugin } from "@flint.fyi/core";
import { configDefaults } from "vitest/config";

import nodeTestImports from "./rules/nodeTestImports.ts";

export const vitest = createPlugin({
	files: {
		all: configDefaults.include,
	},
	name: "Vitest",
	rules: [nodeTestImports],
});

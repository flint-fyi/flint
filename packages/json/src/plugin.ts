import { createPlugin } from "@flint.fyi/core";

import keyDuplicates from "./rules/keyDuplicates.ts";
import keyNormalization from "./rules/keyNormalization.ts";
import valueSafety from "./rules/valueSafety.ts";

export const json = createPlugin({
	files: {
		all: ["**/*.json"],
	},
	name: "JSON",
	rules: [keyDuplicates, keyNormalization, valueSafety],
});

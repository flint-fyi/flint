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

// TODO: How do we appease TypeScript?!
// The inferred type of 'default' cannot be named without a reference to ...
export type * from "@flint.fyi/json-language";

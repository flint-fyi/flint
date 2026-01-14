import { createPlugin } from "@flint.fyi/core";

import blockMappings from "./rules/blockMappings.ts";
import blockSequences from "./rules/blockSequences.ts";
import emptyDocuments from "./rules/emptyDocuments.ts";
import emptyMappingKeys from "./rules/emptyMappingKeys.ts";
import emptyMappingValues from "./rules/emptyMappingValues.ts";
import numericTrailingZeros from "./rules/numericTrailingZeros.ts";
import plainScalars from "./rules/plainScalars.ts";
import stringMappingKeys from "./rules/stringMappingKeys.ts";

export const yaml = createPlugin({
	files: {
		all: ["**/*.{yaml,yml}"],
	},
	name: "YAML",
	rules: [
		blockMappings,
		blockSequences,
		emptyDocuments,
		emptyMappingKeys,
		emptyMappingValues,
		numericTrailingZeros,
		plainScalars,
		stringMappingKeys,
	],
});

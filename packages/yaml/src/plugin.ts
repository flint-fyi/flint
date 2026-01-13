import { createPlugin } from "@flint.fyi/core";

import blockMappings from "./rules/blockMappings.ts";
import blockSequences from "./rules/blockSequences.ts";
import emptyDocuments from "./rules/emptyDocuments.ts";
import emptyMappingKeys from "./rules/emptyMappingKeys.ts";

export const yaml = createPlugin({
	files: {
		all: ["**/*.{yaml,yml}"],
	},
	name: "YAML",
	rules: [blockMappings, blockSequences, emptyDocuments, emptyMappingKeys],
});

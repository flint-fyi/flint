import { createPlugin } from "@flint.fyi/core";

import deletes from "./rules/deletes.ts";
import importedNamespaceDynamicAccesses from "./rules/importedNamespaceDynamicAccesses.ts";
import loopAwaits from "./rules/loopAwaits.ts";
import loopFunctions from "./rules/loopFunctions.ts";
import spreadAccumulators from "./rules/spreadAccumulators.ts";

export const performance = createPlugin({
	name: "Performance",
	rules: [
		deletes,
		importedNamespaceDynamicAccesses,
		loopAwaits,
		loopFunctions,
		spreadAccumulators,
	],
});

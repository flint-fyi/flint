import { createPlugin } from "@flint.fyi/core";

import assertStrict from "./rules/assertStrict.ts";
import assertStyles from "./rules/assertStyles.ts";
import blobReadingMethods from "./rules/blobReadingMethods.ts";
import bufferAllocators from "./rules/bufferAllocators.ts";
import consoleSpaces from "./rules/consoleSpaces.ts";
import eventClasses from "./rules/eventClasses.ts";
import exportsAssignments from "./rules/exportsAssignments.ts";
import filePathsFromImportMeta from "./rules/filePathsFromImportMeta.ts";
import fileReadJSONBuffers from "./rules/fileReadJSONBuffers.ts";
import nodeProtocols from "./rules/nodeProtocols.ts";
import processExits from "./rules/processExits.ts";

export const node = createPlugin({
	name: "Node.js",
	rules: [
		assertStrict,
		assertStyles,
		blobReadingMethods,
		bufferAllocators,
		consoleSpaces,
		eventClasses,
		exportsAssignments,
		filePathsFromImportMeta,
		fileReadJSONBuffers,
		nodeProtocols,
		processExits,
	],
});

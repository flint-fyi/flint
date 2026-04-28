import { createPlugin } from "@flint.fyi/core";

import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";

export const packageJson = createPlugin({
	files: {
		all: ["**/package.json"],
	},
	name: "PackageJSON",
	rules: [
		// TODO: More rules to come very soon!
		...Object.values(directPropertyValidityRules),
	],
});

import { createPlugin } from "@flint.fyi/core";

import { directPropertyPresenceRules } from "./directPropertyPresenceRules.ts";
import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import binNameCasing from "./rules/binNameCasing.ts";
import privatePresence from "./rules/privatePresence.ts";

export const packageJson = createPlugin({
	files: {
		all: ["**/package.json"],
	},
	name: "PackageJSON",
	rules: [
		binNameCasing,
		privatePresence,
		...Object.values(directPropertyPresenceRules),
		...Object.values(directPropertyValidityRules),
	],
});

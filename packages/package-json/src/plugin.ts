import { createPlugin } from "@flint.fyi/core";

import { directPropertyPresenceRules } from "./directPropertyPresenceRules.ts";
import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import binNameCasing from "./rules/binNameCasing.ts";
import dependencyUniqueness from "./rules/dependencyUniqueness.ts";
import privatePresence from "./rules/privatePresence.ts";
import repositoryShorthand from "./rules/repositoryShorthand.ts";
import scriptsNameCasing from "./rules/scriptsNameCasing.ts";

export const packageJson = createPlugin({
	files: {
		all: ["**/package.json"],
	},
	name: "PackageJSON",
	rules: [
		binNameCasing,
		dependencyUniqueness,
		privatePresence,
		repositoryShorthand,
		scriptsNameCasing,
		...Object.values(directPropertyPresenceRules),
		...Object.values(directPropertyValidityRules),
	],
});

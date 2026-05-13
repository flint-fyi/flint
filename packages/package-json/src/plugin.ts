import { createPlugin } from "@flint.fyi/core";

import { directPropertyPresenceRules } from "./directPropertyPresenceRules.ts";
import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import attribution from "./rules/attribution.ts";
import binNameCasing from "./rules/binNameCasing.ts";
import dependencyUniqueness from "./rules/dependencyUniqueness.ts";
import emptyFields from "./rules/emptyFields.ts";
import exportsSubpathsStyle from "./rules/exportsSubpathsStyle.ts";
import filesRedundancy from "./rules/filesRedundancy.ts";
import peerDependenciesInstallation from "./rules/peerDependenciesInstallation.ts";
import peerDependenciesMetaRelationship from "./rules/peerDependenciesMetaRelationship.ts";
import privatePackageProperties from "./rules/privatePackageProperties.ts";
import privatePresence from "./rules/privatePresence.ts";
import publishConfigRedundancy from "./rules/publishConfigRedundancy.ts";
import repositoryShorthand from "./rules/repositoryShorthand.ts";
import scriptsNameCasing from "./rules/scriptsNameCasing.ts";

export const packageJson = createPlugin({
	files: {
		all: ["**/package.json"],
	},
	name: "PackageJSON",
	rules: [
		attribution,
		binNameCasing,
		dependencyUniqueness,
		emptyFields,
		exportsSubpathsStyle,
		filesRedundancy,
		peerDependenciesInstallation,
		peerDependenciesMetaRelationship,
		privatePackageProperties,
		privatePresence,
		publishConfigRedundancy,
		repositoryShorthand,
		scriptsNameCasing,
		...Object.values(directPropertyPresenceRules),
		...Object.values(directPropertyValidityRules),
	],
});

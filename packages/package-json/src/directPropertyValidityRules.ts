import {
	validateAuthor,
	validateBin,
	validateBrowser,
	validateBugs,
	validateBundleDependencies,
	validateConfig,
	validateContributors,
	validateCpu,
	validateDependencies,
	validateDescription,
	validateDevDependencies,
	validateDevEngines,
	validateDirectories,
	validateEngines,
	validateExports,
	validateFiles,
	validateFunding,
	validateGypfile,
	validateHomepage,
	validateKeywords,
	validateLibc,
	validateLicense,
	validateMain,
	validateMan,
	validateName,
	validateOptionalDependencies,
	validateOs,
	validatePackageManager,
	validatePeerDependencies,
	validatePeerDependenciesMeta,
	validatePrivate,
	validatePublishConfig,
	validateRepository,
	validateScripts,
	validateSideEffects,
	validateType,
	validateVersion,
	validateWorkspaces,
} from "package-json-validator";

import {
	createDirectPropertyValidityRule,
	type PropertyValidator,
	type ValidityRule,
	type ValidityRuleName,
} from "./createDirectPropertyValidityRule.ts";

interface LocalValidPropertyOptions {
	aliases: readonly string[];
	validator: PropertyValidator;
}

type PropertyConfig = readonly [
	string,
	LocalValidPropertyOptions | PropertyValidator,
];

function defineProperties<const T extends readonly PropertyConfig[]>(
	properties: T,
) {
	return properties as {
		[K in keyof T]: T[K] extends readonly [infer Name extends string, unknown]
			? readonly [Name, PropertyConfig[1]]
			: T[K];
	};
}

const properties = defineProperties([
	["author", validateAuthor],
	["bin", validateBin],
	["browser", validateBrowser],
	["bugs", validateBugs],
	[
		"bundleDependencies",
		{
			aliases: ["bundledDependencies"],
			validator: validateBundleDependencies,
		},
	],
	["config", validateConfig],
	["contributors", validateContributors],
	["cpu", validateCpu],
	["dependencies", validateDependencies],
	["description", validateDescription],
	["devDependencies", validateDevDependencies],
	["devEngines", validateDevEngines],
	["directories", validateDirectories],
	["engines", validateEngines],
	["exports", validateExports],
	["files", validateFiles],
	["funding", validateFunding],
	["gypfile", validateGypfile],
	["homepage", validateHomepage],
	["keywords", validateKeywords],
	["libc", validateLibc],
	["license", validateLicense],
	["main", validateMain],
	["man", validateMan],
	["module", validateMain],
	["name", validateName],
	["optionalDependencies", validateOptionalDependencies],
	["os", validateOs],
	["packageManager", validatePackageManager],
	["peerDependencies", validatePeerDependencies],
	["peerDependenciesMeta", validatePeerDependenciesMeta],
	["private", validatePrivate],
	["publishConfig", validatePublishConfig],
	["repository", validateRepository],
	["scripts", validateScripts],
	["sideEffects", validateSideEffects],
	["type", validateType],
	["version", validateVersion],
	["workspaces", validateWorkspaces],
]);

type ValidityProperty = (typeof properties)[number][0];

export const directPropertyValidityRules = Object.fromEntries(
	properties.map(([propertyName, propertySettings]) => {
		const [propertyNameAliases, propertyValidator] =
			typeof propertySettings === "object"
				? [propertySettings.aliases, propertySettings.validator]
				: [[], propertySettings];

		const { id, rule } = createDirectPropertyValidityRule(
			propertyName,
			propertyNameAliases,
			propertyValidator,
		);
		return [id, rule] as const;
	}),
) as {
	[PropertyName in ValidityProperty as ValidityRuleName<PropertyName>]: ValidityRule<PropertyName>;
};

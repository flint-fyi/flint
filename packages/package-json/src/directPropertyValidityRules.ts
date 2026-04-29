import type { AnyRule } from "@flint.fyi/core";
import {
	validateAuthor,
	validateBin,
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
	validateHomepage,
	validateKeywords,
	validateLicense,
	validateMain,
	validateMan,
	validateName,
	validateOptionalDependencies,
	validateOs,
	validatePackageManager,
	validatePeerDependencies,
	validatePrivate,
	validatePublishConfig,
	validateRepository,
	validateScripts,
	validateSideEffects,
	validateType,
	validateVersion,
	validateWorkspaces,
} from "package-json-validator";

import { createDirectPropertyValidityRule } from "./createDirectPropertyValidityRule.ts";

const properties = [
	["author", validateAuthor],
	["bin", validateBin],
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
	["homepage", validateHomepage],
	["keywords", validateKeywords],
	["license", validateLicense],
	["main", validateMain],
	["man", validateMan],
	["module", validateMain],
	["name", validateName],
	["optionalDependencies", validateOptionalDependencies],
	["os", validateOs],
	["packageManager", validatePackageManager],
	["peerDependencies", validatePeerDependencies],
	["private", validatePrivate],
	["publishConfig", validatePublishConfig],
	["repository", validateRepository],
	["scripts", validateScripts],
	["sideEffects", validateSideEffects],
	["type", validateType],
	["version", validateVersion],
	["workspaces", validateWorkspaces],
] as const;

type ValidityProperty = (typeof properties)[number][0];

type ValidityRuleName = `${ValidityProperty}Validity`;

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
) as Record<ValidityRuleName, AnyRule>;

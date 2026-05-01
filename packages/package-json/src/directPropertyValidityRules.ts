import type { AnyRule } from "@flint.fyi/core";
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

import { createDirectPropertyValidityRule } from "./createDirectPropertyValidityRule.ts";

const properties = [
	["gypfile", validateGypfile],
	["libc", validateLibc],
	["peerDependenciesMeta", validatePeerDependenciesMeta],
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

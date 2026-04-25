import type { AnyRule } from "@flint.fyi/core";
import {
	validateAuthor,
	validateBin,
	validateBundleDependencies,
	validateConfig,
	validateContributors,
	validateCpu,
	validateDependencies,
	validateDescription,
	validateDirectories,
	validateEngines,
	validateExports,
	validateFiles,
	validateHomepage,
	validateKeywords,
	validateLicense,
	validateMain,
	validateMan,
	validateOs,
	validatePrivate,
	validatePublishConfig,
	validateRepository,
	validateScripts,
	validateSideEffects,
	validateType,
	validateWorkspaces,
} from "package-json-validator";

import { createDirectPropertyValidityRule } from "./createDirectPropertyValidityRule.ts";

const properties = [
	["author", validateAuthor],
	["bin", validateBin],
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
	["description", validateDescription],
	["dependencies", validateDependencies],
	["devDependencies", validateDependencies],
	["directories", validateDirectories],
	["engines", validateEngines],
	["exports", validateExports],
	["files", validateFiles],
	["homepage", validateHomepage],
	["keywords", validateKeywords],
	["license", validateLicense],
	["main", validateMain],
	["man", validateMan],
	["module", validateMain],
	["optionalDependencies", validateDependencies],
	["os", validateOs],
	["peerDependencies", validateDependencies],
	["private", validatePrivate],
	["publishConfig", validatePublishConfig],
	["repository", validateRepository],
	["scripts", validateScripts],
	["sideEffects", validateSideEffects],
	["type", validateType],
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

import type { DocumentNode } from "@humanwhocodes/momoa";
import { z } from "zod/v4";

import type { Rule } from "@flint.fyi/core";
import { jsonLanguage } from "@flint.fyi/json-language";

import { getPackagePropertyOfName } from "./getPackagePropertyOfName.ts";
import { isBooleanTrue } from "./isBooleanNode.ts";
import { ruleCreator } from "./ruleCreator.ts";

export interface CreatePropertyPresenceRuleOptions {
	/**
	 * A default value for the `ignorePrivate` rule option.
	 */
	ignorePrivateDefault?: boolean;

	/**
	 * Whether to put this rule in the "logical" preset.
	 */
	logical?: boolean;
}

export type PresenceRule<PropertyName extends string> = Rule<
	{
		readonly description: string;
		readonly id: PresenceRuleName<PropertyName>;
		readonly presets?: readonly ["logical"];
	} & {
		readonly pluginId: string;
		readonly url: string;
	},
	"missing",
	{
		ignorePrivate: z.ZodDefault<z.ZodBoolean>;
	}
>;

export type PresenceRuleName<PropertyName extends string> =
	`${PropertyName}Presence`;

export function createDirectPropertyValidityRule<
	const PropertyName extends string,
>(
	propertyName: PropertyName,
	{
		ignorePrivateDefault = false,
		logical,
	}: CreatePropertyPresenceRuleOptions = {},
): {
	id: PresenceRuleName<PropertyName>;
	rule: PresenceRule<PropertyName>;
} {
	const id = `${propertyName}Presence` as const;

	const rule = ruleCreator.createRule(jsonLanguage, {
		about: {
			description: `Enforces that the \`${propertyName}\` property is present.`,
			id,
			...(logical && { presets: ["logical"] }),
		},
		messages: {
			missing: {
				primary: `Property \`${propertyName}\` is expected to be present.`,
				secondary: [
					`This repository expects a \`${propertyName}\` property in this package.json file.`,
					`Keeping expected package metadata available helps tooling reason about the package.`,
				],
				suggestions: [`Add the missing \`${propertyName}\`.`],
			},
		},
		options: {
			ignorePrivate: z
				.boolean()
				.default(ignorePrivateDefault)
				.describe(
					"Whether the property should still be required when the package's `private` property is `true`.",
				),
		},
		setup(context) {
			return {
				visitors: {
					Document: (node, { options }) => {
						if (options.ignorePrivate && isPrivatePackage(node)) {
							return;
						}

						if (!getPackagePropertyOfName(node, propertyName)) {
							context.report({
								data: { propertyName },
								message: "missing",
								range: { begin: 0, end: 1 },
							});
						}
					},
				},
			};
		},
	});

	return { id, rule };
}

function isPrivatePackage(rootNode: DocumentNode) {
	const privacy = getPackagePropertyOfName(rootNode, "private");

	return privacy && isBooleanTrue(privacy.value);
}

import type { AnyRule } from "@flint.fyi/core";
import { jsonLanguage } from "@flint.fyi/json-language";
import type { JsonSourceFile } from "@flint.fyi/json-language";
import ts from "typescript";
import { z } from "zod/v4";

import { getPackagePropertyOfName } from "./getPackagePropertyOfName.ts";
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

export function createDirectPropertyValidityRule<PropertyName extends string>(
	propertyName: PropertyName,
	{
		ignorePrivateDefault = false,
		logical,
	}: CreatePropertyPresenceRuleOptions = {},
) {
	const id = `${propertyName}Presence` as const;

	const rule: AnyRule = ruleCreator.createRule(jsonLanguage, {
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
					JsonSourceFile: (node, { options }) => {
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

function isPrivatePackage(node: JsonSourceFile) {
	const privacy = getPackagePropertyOfName(node, "private");

	return (
		privacy?.kind === ts.SyntaxKind.PropertyAssignment &&
		privacy.initializer.kind === ts.SyntaxKind.TrueKeyword
	);
}

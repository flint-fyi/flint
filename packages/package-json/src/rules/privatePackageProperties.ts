import { SyntaxKind } from "typescript";
import { z } from "zod/v4";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { getPackageProperties } from "../getPackageProperties.ts";
import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { removeObjectProperty } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

// flint-disable-next-line ts/deprecated
// eslint-disable-next-line @typescript-eslint/no-deprecated
export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Reports package.json properties that do not apply to private packages.",
		id: "privatePackageProperties",
	},
	messages: {
		unnecessaryProperty: {
			primary:
				"Private packages do not need the `{{ propertyName }}` property.",
			secondary: [
				"This package is marked as private, so npm will not publish it.",
				"Including `{{ propertyName }}` in the `package.json` file does nothing.",
			],
			suggestions: ["Remove the property."],
		},
	},
	options: {
		blockedProperties: z
			.array(z.string())
			.default(["files", "publishConfig"])
			.describe("Package properties to report when `private` is `true`."),
	},
	setup(context) {
		return {
			visitors: {
				JsonSourceFile(node, { options }) {
					const properties = getPackageProperties(node);
					const root = node.statements[0];

					if (
						!properties ||
						root?.expression.kind !== SyntaxKind.ObjectLiteralExpression
					) {
						return;
					}

					const privateProperty = getPackagePropertyOfName(node, "private");

					if (
						privateProperty?.kind !== SyntaxKind.PropertyAssignment ||
						privateProperty.initializer.kind !== SyntaxKind.TrueKeyword
					) {
						return;
					}

					const blockedProperties = new Set(options.blockedProperties);

					for (const property of properties) {
						if (
							property.kind !== SyntaxKind.PropertyAssignment ||
							property.name.kind !== SyntaxKind.StringLiteral ||
							!blockedProperties.has(property.name.text)
						) {
							continue;
						}

						const { range, text } = removeObjectProperty(
							node,
							property,
							root.expression,
						);

						context.report({
							data: {
								propertyName: property.name.text,
							},
							message: "unnecessaryProperty",
							range: getJsonNodeRange(property.name, node),
							suggestions: [
								{
									id: "removePrivatePackageProperty",
									range,
									text,
								},
							],
						});
					}
				},
			},
		};
	},
});

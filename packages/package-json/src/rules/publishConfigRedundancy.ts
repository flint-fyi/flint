import { SyntaxKind } from "typescript";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { getPackagePropertiesOfNamesLegacy } from "../getPackagePropertiesOfNames.ts";
import { removeObjectPropertyLegacy } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

// flint-disable-next-line ts/deprecated
// eslint-disable-next-line @typescript-eslint/no-deprecated
export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Reports `publishConfig.access` fields that do not affect unscoped packages.",
		id: "publishConfigRedundancy",
		presets: ["logical"],
	},
	messages: {
		redundantAccess: {
			primary:
				"Unscoped packages are always published with public access, so this field has no effect.",
			secondary: [
				"`publishConfig.access` only changes publishing access for scoped packages.",
			],
			suggestions: ["Remove the redundant access field."],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsonSourceFile(node) {
					const { name, publishConfig } = getPackagePropertiesOfNamesLegacy(
						node,
						["name", "publishConfig"],
					);

					if (
						name?.kind !== SyntaxKind.PropertyAssignment ||
						name.initializer.kind !== SyntaxKind.StringLiteral ||
						name.initializer.text.startsWith("@")
					) {
						return;
					}

					if (
						publishConfig?.kind !== SyntaxKind.PropertyAssignment ||
						publishConfig.initializer.kind !==
							SyntaxKind.ObjectLiteralExpression
					) {
						return;
					}

					const publishConfigValue = publishConfig.initializer;

					for (const property of publishConfigValue.properties) {
						if (
							property.kind === SyntaxKind.PropertyAssignment &&
							property.name.kind === SyntaxKind.StringLiteral &&
							property.name.text === "access"
						) {
							const { range, text } = removeObjectPropertyLegacy(
								node,
								property,
								publishConfigValue,
							);

							context.report({
								message: "redundantAccess",
								range: getJsonNodeRange(property.name, node),
								suggestions: [
									{
										id: "removeAccess",
										range,
										text,
									},
								],
							});

							return;
						}
					}
				},
			},
		};
	},
});

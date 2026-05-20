import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language";
import { SyntaxKind } from "typescript";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { removeObjectProperty } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

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
				JsonSourceFile(node, { sourceFile }) {
					const nameProperty = getPackagePropertyOfName(node, "name");

					if (
						nameProperty?.kind !== SyntaxKind.PropertyAssignment ||
						nameProperty.initializer.kind !== SyntaxKind.StringLiteral ||
						nameProperty.initializer.text.startsWith("@")
					) {
						return;
					}

					const publishConfigProperty = getPackagePropertyOfName(
						node,
						"publishConfig",
					);

					if (
						publishConfigProperty?.kind !== SyntaxKind.PropertyAssignment ||
						publishConfigProperty.initializer.kind !==
							SyntaxKind.ObjectLiteralExpression
					) {
						return;
					}

					const publishConfig = publishConfigProperty.initializer;

					for (const property of publishConfig.properties) {
						if (
							property.kind === SyntaxKind.PropertyAssignment &&
							property.name.kind === SyntaxKind.StringLiteral &&
							property.name.text === "access"
						) {
							const { range, text } = removeObjectProperty(
								sourceFile,
								property,
								publishConfig,
							);

							context.report({
								message: "redundantAccess",
								range: getJsonNodeRange(property.name, sourceFile),
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

import { z } from "zod/v4";

import { getNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { getPackageProperties } from "../getPackageProperties.ts";
import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { removeObjectProperty } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

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
				Document(node, { options }) {
					const properties = getPackageProperties(node);
					const root = node.body;

					if (!properties || root.type !== "Object") {
						return;
					}

					const privateProperty = getPackagePropertyOfName(node, "private");

					if (
						privateProperty?.value.type !== "Boolean" ||
						!privateProperty.value.value
					) {
						return;
					}

					const blockedProperties = new Set(options.blockedProperties);

					for (const property of properties) {
						if (
							property.name.type !== "String" ||
							!blockedProperties.has(property.name.value)
						) {
							continue;
						}

						const { range, text } = removeObjectProperty(property, root);

						context.report({
							data: {
								propertyName: property.name.value,
							},
							message: "unnecessaryProperty",
							range: getNodeRange(property.name),
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

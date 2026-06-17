import detectIndent from "detect-indent";
import { detectNewlineGraceful } from "detect-newline";
import sortObjectKeys from "sort-object-keys";
import { sortOrder as defaultOrder } from "sort-package-json";
import { z } from "zod/v4";

import { getNodeRange, jsonLanguage } from "@flint.fyi/json-language";

import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Enforces that package properties are declared in a consistent order.",
		id: "propertyOrder",
		presets: ["sorting"],
	},
	messages: {
		incorrectOrder: {
			primary:
				"Top-level property `{{ property }}` is not ordered in the standard way.",
			secondary: [
				"Properties should be declared in a consistent order to improve readability and maintainability.",
			],
			suggestions: ["Reorder properties to match the standard convention."],
		},
	},
	options: {
		customOrder: z
			.array(z.string())
			.optional()
			.describe("Custom order for package properties."),
	},
	setup(context) {
		return {
			visitors: {
				"Document:exit"(node, { options, sourceText }) {
					const body = node.body;
					if (body.type !== "Object") {
						return;
					}

					const sortOrder = options.customOrder ?? defaultOrder;

					const json = JSON.parse(sourceText) as Record<string, unknown>;
					const allKeys = Object.keys(json);
					const orderedNonStandardKeys = allKeys
						.filter((key) => !sortOrder.includes(key))
						.sort();

					const expectedOrder = sortObjectKeys(json, [
						...sortOrder,
						...orderedNonStandardKeys,
					]);
					const orderedKeys = Object.keys(expectedOrder);

					const properties = body.members;

					const fixOrder = () => {
						const { indent, type } = detectIndent(sourceText);
						const newline = detectNewlineGraceful(sourceText);
						const endCharacter = sourceText.endsWith("\n") ? "\n" : "";
						let result =
							JSON.stringify(
								expectedOrder,
								null,
								type === "tab" ? "\t" : indent,
							) + endCharacter;
						if (newline === "\r\n") {
							result = result.replace(/\n/g, newline);
						}

						return result;
					};

					for (let i = 0; i < properties.length; i += 1) {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const property = properties[i]!;
						const propertyKey = property.name;
						if (propertyKey.type !== "String") {
							continue;
						}
						const { value } = propertyKey;

						if (value === orderedKeys[i]) {
							continue;
						}

						context.report({
							data: {
								property: value,
							},
							fix: {
								range: getNodeRange(node),
								text: fixOrder(),
							},
							message: "incorrectOrder",
							range: getNodeRange(propertyKey),
						});
					}
				},
			},
		};
	},
});

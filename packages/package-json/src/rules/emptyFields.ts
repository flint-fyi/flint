import {
	getJsonNodeRange,
	jsonLanguage,
	type JsonSourceFile,
} from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";
import { z } from "zod/v4";

import {
	getArrayElementRemovalSuggestion,
	getObjectPropertyRemovalSuggestion,
} from "../getJsonRemovalSuggestion.ts";
import { getPackageProperties } from "../getPackageProperties.ts";
import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Reports empty package.json fields that do not add package metadata.",
		id: "emptyFields",
		presets: ["logical"],
	},
	messages: {
		emptyExpression: {
			primary: "This empty value does not add package metadata.",
			secondary: [
				"Empty arrays and objects in package.json often come from placeholder fields or incomplete configuration.",
			],
			suggestions: ["Remove the empty value."],
		},
		emptyField: {
			primary: "This empty field does not add package metadata.",
			secondary: [
				"Empty arrays and objects in package.json often come from placeholder fields or incomplete configuration.",
			],
			suggestions: ["Remove the empty field."],
		},
	},
	options: {
		ignoreProperties: z
			.array(z.string())
			.default(["files"])
			.describe("Top-level package.json properties to ignore."),
	},
	setup(context) {
		function checkArrayElement(
			element: AST.Expression,
			sourceFile: JsonSourceFile,
			arrayNode: AST.ArrayLiteralExpression,
		) {
			if (element.kind === SyntaxKind.ArrayLiteralExpression) {
				if (!element.elements.length) {
					reportArrayElement(element, sourceFile, arrayNode);
					return;
				}

				for (const nestedElement of element.elements) {
					checkArrayElement(nestedElement, sourceFile, element);
				}

				return;
			}

			if (element.kind !== SyntaxKind.ObjectLiteralExpression) {
				return;
			}

			if (!element.properties.length) {
				reportArrayElement(element, sourceFile, arrayNode);
				return;
			}

			for (const property of element.properties) {
				if (
					property.kind !== SyntaxKind.PropertyAssignment ||
					property.name.kind !== SyntaxKind.StringLiteral
				) {
					continue;
				}

				checkPropertyValue(
					property.initializer,
					sourceFile,
					property,
					element.properties,
				);
			}
		}

		function checkPropertyValue(
			value: AST.Expression,
			sourceFile: JsonSourceFile,
			property: AST.PropertyAssignment,
			properties: readonly AST.ObjectLiteralElementLike[],
		) {
			if (value.kind === SyntaxKind.ArrayLiteralExpression) {
				if (!value.elements.length) {
					reportPropertyValue(sourceFile, property, properties);
					return;
				}

				for (const element of value.elements) {
					checkArrayElement(element, sourceFile, value);
				}

				return;
			}

			if (value.kind !== SyntaxKind.ObjectLiteralExpression) {
				return;
			}

			if (!value.properties.length) {
				reportPropertyValue(sourceFile, property, properties);
				return;
			}

			for (const nestedProperty of value.properties) {
				if (
					nestedProperty.kind !== SyntaxKind.PropertyAssignment ||
					nestedProperty.name.kind !== SyntaxKind.StringLiteral
				) {
					continue;
				}

				checkPropertyValue(
					nestedProperty.initializer,
					sourceFile,
					nestedProperty,
					value.properties,
				);
			}
		}

		function reportArrayElement(
			element: AST.ArrayLiteralExpression | AST.ObjectLiteralExpression,
			sourceFile: JsonSourceFile,
			arrayNode: AST.ArrayLiteralExpression,
		) {
			const { range, text } = getArrayElementRemovalSuggestion(
				sourceFile,
				element,
				arrayNode,
			);

			context.report({
				message: "emptyExpression",
				range: getJsonNodeRange(element, sourceFile),
				suggestions: [
					{
						id: "removeEmptyField",
						range,
						text,
					},
				],
			});
		}

		function reportPropertyValue(
			sourceFile: JsonSourceFile,
			property: AST.PropertyAssignment,
			properties: readonly AST.ObjectLiteralElementLike[],
		) {
			if (property.name.kind !== SyntaxKind.StringLiteral) {
				return;
			}

			const { range, text } = getObjectPropertyRemovalSuggestion(
				sourceFile,
				property,
				properties,
			);

			context.report({
				message: "emptyField",
				range: getJsonNodeRange(property.name, sourceFile),
				suggestions: [
					{
						id: "removeEmptyField",
						range,
						text,
					},
				],
			});
		}

		return {
			visitors: {
				JsonSourceFile(node, { options, sourceFile }) {
					const ignoredProperties = new Set(options.ignoreProperties);
					const properties = getPackageProperties(node) ?? [];

					for (const property of properties) {
						if (
							property.kind !== SyntaxKind.PropertyAssignment ||
							property.name.kind !== SyntaxKind.StringLiteral
						) {
							continue;
						}

						const propertyName = property.name.text;

						if (ignoredProperties.has(propertyName)) {
							continue;
						}

						checkPropertyValue(
							property.initializer,
							sourceFile,
							property,
							properties,
						);
					}
				},
			},
		};
	},
});

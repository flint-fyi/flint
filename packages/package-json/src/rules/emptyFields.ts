import { SyntaxKind } from "typescript";
import { z } from "zod/v4";

import {
	getJsonNodeRange,
	jsonLanguage,
	type JsonSourceFile,
} from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";

import { removeArrayElementLegacy } from "../removeArrayElement.ts";
import { removeObjectPropertyLegacy } from "../removeObjectProperty.ts";
import { ruleCreator } from "../ruleCreator.ts";

// flint-disable-next-line ts/deprecated
// eslint-disable-next-line @typescript-eslint/no-deprecated
export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Reports empty package.json fields that do not add package metadata.",
		id: "emptyFields",
		presets: ["logical"],
	},
	messages: {
		emptyElement: {
			primary: "This empty element does not add package metadata.",
			secondary: [
				"Empty arrays and objects in package.json often come from placeholder fields or incomplete configuration.",
			],
			suggestions: ["Remove the empty element."],
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
					property.kind === SyntaxKind.PropertyAssignment &&
					property.name.kind === SyntaxKind.StringLiteral
				) {
					checkPropertyValue(property, sourceFile, element);
				}
			}
		}

		function checkPropertyValue(
			property: AST.PropertyAssignment,
			sourceFile: JsonSourceFile,
			objectNode: AST.ObjectLiteralExpression,
		) {
			const value = property.initializer;

			if (value.kind === SyntaxKind.ArrayLiteralExpression) {
				if (!value.elements.length) {
					reportPropertyValue(property, sourceFile, objectNode);
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
				reportPropertyValue(property, sourceFile, objectNode);
				return;
			}

			for (const nestedProperty of value.properties) {
				if (
					nestedProperty.kind === SyntaxKind.PropertyAssignment &&
					nestedProperty.name.kind === SyntaxKind.StringLiteral
				) {
					checkPropertyValue(nestedProperty, sourceFile, value);
				}
			}
		}

		function reportArrayElement(
			element: AST.ArrayLiteralExpression | AST.ObjectLiteralExpression,
			sourceFile: JsonSourceFile,
			arrayNode: AST.ArrayLiteralExpression,
		) {
			const { range, text } = removeArrayElementLegacy(
				sourceFile,
				element,
				arrayNode,
			);

			context.report({
				message: "emptyElement",
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
			property: AST.PropertyAssignment,
			sourceFile: JsonSourceFile,
			objectNode: AST.ObjectLiteralExpression,
		) {
			if (property.name.kind !== SyntaxKind.StringLiteral) {
				return;
			}

			const { range, text } = removeObjectPropertyLegacy(
				sourceFile,
				property,
				objectNode,
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
				JsonSourceFile(node, { options }) {
					const ignoredProperties = new Set(options.ignoreProperties);

					if (node.statements.length !== 1) {
						return;
					}

					const expression = node.statements[0]?.expression;
					if (expression?.kind !== SyntaxKind.ObjectLiteralExpression) {
						return;
					}

					for (const property of expression.properties) {
						if (
							property.kind === SyntaxKind.PropertyAssignment &&
							property.name.kind === SyntaxKind.StringLiteral &&
							!ignoredProperties.has(property.name.text)
						) {
							checkPropertyValue(property, node, expression);
						}
					}
				},
			},
		};
	},
});

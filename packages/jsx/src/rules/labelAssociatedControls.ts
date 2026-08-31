import {
	isIdentifier,
	isJsxAttribute,
	isJsxElement,
	isJsxExpression,
	isJsxSelfClosingElement,
	isNoSubstitutionTemplateLiteral,
	isStringLiteral,
	SyntaxKind,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const controlElements = new Set([
	"input",
	"meter",
	"output",
	"progress",
	"select",
	"textarea",
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports <label> elements without an associated control element.",
		id: "labelAssociatedControls",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		missingAssociatedControl: {
			primary: "This <label> element is missing an associated control element.",
			secondary: [
				"Labels must be associated with a control element to be accessible to screen readers.",
				"Use the htmlFor prop to reference a control by id, or nest the control inside the label.",
				"This is required for WCAG 1.3.1, 2.4.6, and 4.1.2 compliance.",
			],
			suggestions: [
				"Add an htmlFor prop that references a control element by id",
				"Nest a control element (input, select, textarea) inside the label",
			],
		},
	},
	setup(context) {
		function hasHtmlForAttribute(attributes: AST.JsxAttributes): boolean {
			return attributes.properties.some((property) => {
				if (
					!isJsxAttribute(property) ||
					!isIdentifier(property.name) ||
					property.name.text !== "htmlFor" ||
					!property.initializer
				) {
					return false;
				}

				if (isStringLiteral(property.initializer)) {
					return property.initializer.text !== "";
				}

				if (isJsxExpression(property.initializer)) {
					const { expression } = property.initializer;
					if (!expression) {
						return false;
					}

					if (
						(isStringLiteral(expression) && expression.text === "") ||
						(isNoSubstitutionTemplateLiteral(expression) &&
							expression.text === "") ||
						(isIdentifier(expression) && expression.text === "undefined") ||
						expression.kind === SyntaxKind.NullKeyword
					) {
						return false;
					}
				}

				return true;
			});
		}

		function hasNestedControl(children: readonly AST.JsxChild[]): boolean {
			return children.some((child) => {
				if (isJsxElement(child)) {
					const { tagName } = child.openingElement;
					return (
						(isIdentifier(tagName) &&
							controlElements.has(tagName.text.toLowerCase())) ||
						hasNestedControl(child.children)
					);
				}

				if (isJsxSelfClosingElement(child)) {
					return (
						isIdentifier(child.tagName) &&
						controlElements.has(child.tagName.text.toLowerCase())
					);
				}

				return false;
			});
		}

		function checkLabel(
			node: AST.JsxElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (isJsxElement(node) && hasNestedControl(node.children)) {
				return;
			}

			const tagName = isJsxElement(node)
				? node.openingElement.tagName
				: node.tagName;

			if (!isIdentifier(tagName) || tagName.text.toLowerCase() !== "label") {
				return;
			}

			const attributes = isJsxElement(node)
				? node.openingElement.attributes
				: node.attributes;

			if (hasHtmlForAttribute(attributes)) {
				return;
			}

			context.report({
				message: "missingAssociatedControl",
				range: getTSNodeRange(tagName, sourceFile),
			});
		}

		return {
			visitors: {
				JsxElement: checkLabel,
				JsxSelfClosingElement: checkLabel,
			},
		};
	},
});

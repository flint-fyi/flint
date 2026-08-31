import {
	isIdentifier,
	isJsxAttribute,
	isJsxElement,
	isJsxExpression,
	isJsxSelfClosingElement,
	isNoSubstitutionTemplateLiteral,
	isStringLiteral,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports <svg> elements without a <title> child element.",
		id: "svgTitles",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		missingTitle: {
			primary: "This <svg> element is missing a <title> child element.",
			secondary: [
				"SVG elements without a title are not accessible to screen readers.",
				"The <title> element provides a text description of the SVG's content.",
				"This is required for WCAG 1.1.1 compliance.",
			],
			suggestions: [
				"Add a <title> child element with descriptive text",
				"Use aria-label or aria-labelledby as an alternative",
			],
		},
	},
	setup(context) {
		function hasValidAriaLabel(attributes: AST.JsxAttributes): boolean {
			return attributes.properties.some((property) => {
				if (
					!isJsxAttribute(property) ||
					!isIdentifier(property.name) ||
					(property.name.text !== "aria-label" &&
						property.name.text !== "aria-labelledby")
				) {
					return false;
				}

				if (!property.initializer) {
					return false;
				}

				if (isJsxExpression(property.initializer)) {
					const { expression } = property.initializer;
					if (!expression) {
						return false;
					}

					if (
						isStringLiteral(expression) ||
						isNoSubstitutionTemplateLiteral(expression)
					) {
						return expression.text !== "";
					}

					if (isIdentifier(expression)) {
						return expression.text !== "undefined";
					}
				}

				if (isStringLiteral(property.initializer)) {
					return property.initializer.text !== "";
				}

				return false;
			});
		}

		function checkElement(
			node: AST.JsxElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const tagName = isJsxElement(node)
				? node.openingElement.tagName
				: node.tagName;

			if (!isIdentifier(tagName) || tagName.text.toLowerCase() !== "svg") {
				return;
			}

			const attributes = isJsxElement(node)
				? node.openingElement.attributes
				: node.attributes;

			if (hasValidAriaLabel(attributes)) {
				return;
			}

			if (isJsxElement(node) && node.children.some(isTitleElement)) {
				return;
			}

			context.report({
				message: "missingTitle",
				range: getTSNodeRange(tagName, sourceFile),
			});
		}

		return {
			visitors: {
				JsxElement: checkElement,
				JsxSelfClosingElement: checkElement,
			},
		};
	},
});

function isTitleElement(node: AST.JsxChild) {
	if (!isJsxElement(node) && !isJsxSelfClosingElement(node)) {
		return false;
	}

	const childTagName = isJsxElement(node)
		? node.openingElement.tagName
		: node.tagName;

	return isIdentifier(childTagName) && childTagName.text === "title";
}

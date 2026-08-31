import {
	isIdentifier,
	isJsxAttribute,
	isJsxElement,
	isJsxExpression,
	isJsxSelfClosingElement,
	isJsxText,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const headingElements = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports heading elements without accessible content.",
		id: "headingContents",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		emptyHeading: {
			primary: "This heading element is missing accessible content.",
			secondary: [
				"Headings without content are not accessible to screen readers.",
				"Ensure the heading has text content or uses aria-label/aria-labelledby.",
				"This is required for WCAG 2.4.6 compliance.",
			],
			suggestions: [
				"Add text content to the heading",
				"Use aria-label or aria-labelledby to provide accessible text",
			],
		},
	},
	setup(context) {
		function checkHeading(
			node: AST.JsxElement | AST.JsxSelfClosingElement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const tagName = isJsxElement(node)
				? node.openingElement.tagName
				: node.tagName;

			if (
				!isIdentifier(tagName) ||
				!headingElements.has(tagName.text.toLowerCase())
			) {
				return;
			}

			const attributes = isJsxElement(node)
				? node.openingElement.attributes
				: node.attributes;

			if (
				attributes.properties.some((property) => {
					if (!isJsxAttribute(property) || !isIdentifier(property.name)) {
						return false;
					}

					return (
						(property.name.text === "aria-label" ||
							property.name.text === "aria-labelledby") &&
						!!property.initializer
					);
				})
			) {
				return;
			}

			if (
				isJsxElement(node) &&
				node.children.some((child) => {
					if (isJsxText(child)) {
						return !!child.text.trim().length;
					}
					return (
						isJsxElement(child) ||
						isJsxSelfClosingElement(child) ||
						isJsxExpression(child)
					);
				})
			) {
				return;
			}

			context.report({
				message: "emptyHeading",
				range: getTSNodeRange(tagName, sourceFile),
			});
		}

		return {
			visitors: {
				JsxElement: checkHeading,
				JsxSelfClosingElement: checkHeading,
			},
		};
	},
});

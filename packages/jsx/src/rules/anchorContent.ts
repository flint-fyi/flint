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
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports anchor elements without accessible content.",
		id: "anchorContent",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		missingContent: {
			primary: "This anchor element is missing accessible content.",
			secondary: [
				"Non-visual tools such as screen readers and search engine crawlers need content to describe links.",
				"Provide text content, aria-label, aria-labelledby, or title attribute.",
				"This is required for WCAG 2.4.4 and 4.1.2 compliance.",
			],
			suggestions: [
				"Add text content inside the anchor",
				"Add an aria-label attribute",
				"Add a title attribute",
			],
		},
	},
	setup(context) {
		function hasAccessibleContent(
			element: AST.JsxOpeningElement | AST.JsxSelfClosingElement,
		): boolean {
			return element.attributes.properties.some(
				(property) =>
					isJsxAttribute(property) &&
					isIdentifier(property.name) &&
					(property.name.text === "aria-label" ||
						property.name.text === "aria-labelledby" ||
						property.name.text === "title") &&
					property.initializer,
			);
		}

		function hasTextContent(element: AST.JsxElement) {
			return element.children.some((child) => {
				if (isJsxText(child) && child.text.trim()) {
					return true;
				}

				if (isJsxElement(child) || isJsxSelfClosingElement(child)) {
					const childElement = isJsxElement(child)
						? child.openingElement
						: child;

					if (
						!childElement.attributes.properties.some(
							(attr) =>
								isJsxAttribute(attr) &&
								isIdentifier(attr.name) &&
								attr.name.text === "aria-hidden",
						)
					) {
						return true;
					}
				}

				if (isJsxExpression(child) && child.expression) {
					return true;
				}
			});
		}

		return {
			visitors: {
				JsxElement(node, { sourceFile }) {
					const openingElement = node.openingElement;
					if (
						isIdentifier(openingElement.tagName) &&
						openingElement.tagName.text === "a" &&
						!hasAccessibleContent(openingElement) &&
						!hasTextContent(node)
					) {
						context.report({
							message: "missingContent",
							range: getTSNodeRange(openingElement, sourceFile),
						});
					}
				},
				JsxSelfClosingElement(node, { sourceFile }) {
					if (
						isIdentifier(node.tagName) &&
						node.tagName.text === "a" &&
						!hasAccessibleContent(node)
					) {
						context.report({
							message: "missingContent",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});

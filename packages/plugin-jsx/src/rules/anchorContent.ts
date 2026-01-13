import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports anchor elements without accessible content.",
		id: "anchorContent",
		preset: "logical",
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
					property.kind === SyntaxKind.JsxAttribute &&
					property.name.kind === SyntaxKind.Identifier &&
					(property.name.text === "aria-label" ||
						property.name.text === "aria-labelledby" ||
						property.name.text === "title") &&
					property.initializer,
			);
		}

		function hasTextContent(element: AST.JsxElement) {
			return element.children.some((child) => {
				if (child.kind === SyntaxKind.JsxText && child.text.trim()) {
					return true;
				}

				if (
					child.kind === SyntaxKind.JsxElement ||
					child.kind === SyntaxKind.JsxSelfClosingElement
				) {
					const childElement =
						child.kind === SyntaxKind.JsxElement ? child.openingElement : child;

					if (
						!childElement.attributes.properties.some(
							(attr) =>
								attr.kind === SyntaxKind.JsxAttribute &&
								attr.name.kind === SyntaxKind.Identifier &&
								attr.name.text === "aria-hidden",
						)
					) {
						return true;
					}
				}

				if (child.kind === SyntaxKind.JsxExpression && child.expression) {
					return true;
				}
			});
		}

		return {
			visitors: {
				JsxElement(node, { sourceFile }) {
					const openingElement = node.openingElement;
					if (
						openingElement.tagName.kind === SyntaxKind.Identifier &&
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
						node.tagName.kind === SyntaxKind.Identifier &&
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

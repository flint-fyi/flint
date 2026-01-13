import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const headingElements = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export default typescriptLanguage.createRule({
	about: {
		description: "Reports heading elements without accessible content.",
		id: "headingContents",
		preset: "logical",
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
			const tagName =
				node.kind == SyntaxKind.JsxElement
					? node.openingElement.tagName
					: node.tagName;

			if (
				tagName.kind !== SyntaxKind.Identifier ||
				!headingElements.has(tagName.text.toLowerCase())
			) {
				return;
			}

			const attributes =
				node.kind == SyntaxKind.JsxElement
					? node.openingElement.attributes
					: node.attributes;

			if (
				attributes.properties.some((property) => {
					if (
						property.kind !== SyntaxKind.JsxAttribute ||
						property.name.kind !== SyntaxKind.Identifier
					) {
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
				node.kind === SyntaxKind.JsxElement &&
				node.children.some((child) => {
					if (child.kind === SyntaxKind.JsxText) {
						return child.text.trim().length > 0;
					}
					return (
						child.kind === SyntaxKind.JsxElement ||
						child.kind === SyntaxKind.JsxSelfClosingElement ||
						child.kind === SyntaxKind.JsxExpression
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

import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const ambiguousWords = new Set([
	"a link",
	"click here",
	"here",
	"learn more",
	"link",
	"more",
	"read more",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports anchor elements with ambiguous text that doesn't describe the link destination.",
		id: "anchorAmbiguousText",
		preset: "logical",
	},
	messages: {
		ambiguousText: {
			primary:
				"This anchor element has ambiguous text that doesn't describe the link destination.",
			secondary: [
				"Ambiguous text like '{{ text }}' doesn't provide context about where the link goes.",
				"Screen reader users often navigate by links and need descriptive text to understand the purpose.",
				"Provide descriptive text that explains what the link does or where it leads.",
			],
			suggestions: [
				"Replace vague text with descriptive text that explains the link destination",
				"Include the page or section name the link leads to",
				"Describe the action that will occur when clicking the link",
			],
		},
	},
	setup(context) {
		function getTextContent(node: AST.JsxElement): string {
			let text = "";

			for (const child of node.children) {
				if (child.kind === SyntaxKind.JsxText) {
					text += child.text;
				} else if (child.kind === SyntaxKind.JsxElement) {
					text += getTextContent(child);
				} else if (child.kind === SyntaxKind.JsxExpression) {
					if (
						child.expression &&
						child.expression.kind === SyntaxKind.StringLiteral
					) {
						text += child.expression.text;
					}
				}
			}

			return text;
		}

		return {
			visitors: {
				JsxElement(node, { sourceFile }) {
					if (
						node.openingElement.tagName.kind !== SyntaxKind.Identifier ||
						node.openingElement.tagName.text !== "a"
					) {
						return;
					}

					const textContent = getTextContent(node);
					if (!ambiguousWords.has(textContent.toLowerCase().trim())) {
						return;
					}

					const textNodes = node.children.filter(
						(child) => child.kind === SyntaxKind.JsxText && child.text.trim(),
					);

					context.report({
						data: { text: textContent.trim() },
						message: "ambiguousText",
						range: getTSNodeRange(
							textNodes[0] ?? node.openingElement,
							sourceFile,
						),
					});
				},
			},
		};
	},
});

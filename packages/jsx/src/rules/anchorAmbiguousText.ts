import {
	isIdentifier,
	isJsxElement,
	isJsxExpression,
	isJsxText,
	isStringLiteral,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const ambiguousWords = new Set([
	"a link",
	"click here",
	"here",
	"learn more",
	"link",
	"more",
	"read more",
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports anchor elements with ambiguous text that doesn't describe the link destination.",
		id: "anchorAmbiguousText",
		presets: ["logical", "logicalStrict"],
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
				if (isJsxText(child)) {
					text += child.text;
				} else if (isJsxElement(child)) {
					text += getTextContent(child);
				} else if (
					isJsxExpression(child) &&
					child.expression &&
					isStringLiteral(child.expression)
				) {
					text += child.expression.text;
				}
			}

			return text;
		}

		return {
			visitors: {
				JsxElement(node, { sourceFile }) {
					if (
						!isIdentifier(node.openingElement.tagName) ||
						node.openingElement.tagName.text !== "a"
					) {
						return;
					}

					const textContent = getTextContent(node);
					if (!ambiguousWords.has(textContent.toLowerCase().trim())) {
						return;
					}

					const textNodes = node.children.filter(
						(child) => isJsxText(child) && child.text.trim(),
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

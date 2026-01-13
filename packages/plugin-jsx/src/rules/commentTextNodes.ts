import { getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports JSX text nodes that contain comment syntax but are rendered as text.",
		id: "commentTextNodes",
		preset: "logical",
	},
	messages: {
		commentAsText: {
			primary:
				"This text looks like a comment but will be rendered as text in the JSX output.",
			secondary: [
				"In JSX, text that looks like comments (// or /* */) is rendered as literal text.",
				"To add actual comments in JSX, wrap them in braces: {/* comment */}.",
				"If this is intentional text, consider making it clearer that it's not a comment.",
			],
			suggestions: [
				"Use {/* comment */} for actual comments",
				"Remove the comment-like syntax if it's unintended",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsxText(node, { sourceFile }) {
					const text = node.text;

					if (/^\s*(?:\/\/|\/\*)/.test(text)) {
						context.report({
							message: "commentAsText",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});

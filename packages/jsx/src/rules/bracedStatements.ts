import {
	isJsxElement,
	isJsxFragment,
	isJsxSelfClosingElement,
	isStringLiteral,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallow unnecessary JSX curly braces around literals and JSX elements.",
		id: "bracedStatements",
		presets: ["stylistic"],
	},
	messages: {
		unnecessaryBraces: {
			primary: "Curly braces are unnecessary around {{ type }}.",
			secondary: [
				"Curly braces are unnecessary when they wrap simple literals or JSX elements.",
				"Removing them improves readability and reduces visual clutter.",
			],
			suggestions: ["Remove the curly braces and use the content directly."],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsxExpression(node, { sourceFile }) {
					if (
						!node.expression ||
						(!isJsxElement(node.parent) && !isJsxFragment(node.parent))
					) {
						return;
					}

					let unnecessaryType: string | undefined;

					if (isStringLiteral(node.expression)) {
						unnecessaryType = "string literals";
					} else if (
						isJsxElement(node.expression) ||
						isJsxSelfClosingElement(node.expression) ||
						isJsxFragment(node.expression)
					) {
						unnecessaryType = "JSX elements";
					}

					if (unnecessaryType) {
						context.report({
							data: { type: unnecessaryType },
							message: "unnecessaryBraces",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});

import {
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
	unwrapParenthesizedExpression,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `instanceof Array` instead of `Array.isArray()`.",
		id: "instanceOfArrays",
		presets: ["logical"],
	},
	messages: {
		useArrayIsArray: {
			primary: "Use `Array.isArray()` instead of `instanceof Array`.",
			secondary: [
				"The `instanceof Array` check can fail across different execution contexts (e.g., iframes or realms).",
				"It may also give incorrect results for array-like objects.",
			],
			suggestions: ["Use `Array.isArray(value)` for reliable array detection."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile, typeChecker }) => {
					if (node.operatorToken.kind !== SyntaxKind.InstanceOfKeyword) {
						return;
					}

					const right = unwrapParenthesizedExpression(node.right);
					if (
						right.kind !== SyntaxKind.Identifier ||
						right.text !== "Array" ||
						!isGlobalDeclarationOfName(right, "Array", typeChecker)
					) {
						return;
					}

					context.report({
						message: "useArrayIsArray",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});

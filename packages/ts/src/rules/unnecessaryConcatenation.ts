import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports string concatenation using the + operator when both operands are string literals.",
		id: "unnecessaryConcatenation",
		preset: "stylistic",
	},
	messages: {
		unnecessaryConcatenation: {
			primary:
				"This string concatenation can be streamlined into a single string literal.",
			secondary: [
				"Concatenating string literals with the + operator is unnecessary and reduces code readability.",
				"String literals can be combined into a single literal, which is clearer and potentially more performant.",
			],
			suggestions: [
				"Combine the string literals into a single string literal.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (
						node.operatorToken.kind === SyntaxKind.PlusToken &&
						node.left.kind === SyntaxKind.StringLiteral &&
						node.right.kind === SyntaxKind.StringLiteral
					) {
						context.report({
							message: "unnecessaryConcatenation",
							range: getTSNodeRange(node.operatorToken, sourceFile),
						});
					}
				},
			},
		};
	},
});

import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports using the comma operator in expressions.",
		id: "sequences",
		preset: "untyped",
	},
	messages: {
		noSequences: {
			primary:
				'The "sequence" (comma) operator is often confusing and a sign of mistaken logic.',
			secondary: [
				"The comma operator can make code harder to read and may hide side effects.",
				"Prefer separate expressions instead of using a single sequence.",
			],
			suggestions: ["Split the expression into separate statements."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					if (node.operatorToken.kind === SyntaxKind.CommaToken) {
						context.report({
							message: "noSequences",
							range: getTSNodeRange(node.operatorToken, sourceFile),
						});
					}
				},
			},
		};
	},
});

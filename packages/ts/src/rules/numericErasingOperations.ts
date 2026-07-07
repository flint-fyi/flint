import ts from "typescript";

import {
	getStaticNumberValue,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isZeroLiteral(node: AST.Expression) {
	return Object.is(getStaticNumberValue(node), 0);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports operations that always result in zero, such as multiplication by zero.",
		id: "numericErasingOperations",
		presets: ["logicalStrict"],
	},
	messages: {
		erasingOperation: {
			primary: "This expression will always evaluate to zero.",
			secondary: [
				"Using `0` in this operation always produces a result that is also `0`.",
				"This is often a sign of incompletely refactored code or incorrect program logic.",
			],
			suggestions: [
				"Remove the operation",
				"Replace with `0`",
				"Change the operation to use a non-zero value",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					switch (node.operatorToken.kind) {
						case ts.SyntaxKind.AmpersandToken:
						case ts.SyntaxKind.AsteriskToken:
							if (isZeroLiteral(node.left) || isZeroLiteral(node.right)) {
								context.report({
									message: "erasingOperation",
									range: getTSNodeRange(node, sourceFile),
								});
							}
							break;

						case ts.SyntaxKind.SlashToken:
							if (isZeroLiteral(node.left) && !isZeroLiteral(node.right)) {
								context.report({
									message: "erasingOperation",
									range: getTSNodeRange(node, sourceFile),
								});
							}
							break;
					}
				},
			},
		};
	},
});

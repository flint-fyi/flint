import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isZeroLiteral(node: AST.Expression) {
	if (node.kind !== ts.SyntaxKind.NumericLiteral) {
		return false;
	}

	return node.text === "0";
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
				"This is most likely not the intended outcome.",
				"Consider removing the operation or using `0` directly.",
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

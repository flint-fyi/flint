import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports typeof undefined checks.",
		id: "undefinedTypeofChecks",
		presets: ["stylistic"],
	},
	messages: {
		directComparison: {
			primary: "Use direct undefined comparison instead of typeof.",
			secondary: [
				"'typeof x === \"undefined\"' can be simplified to 'x === undefined'.",
			],
			suggestions: ["Replace with direct undefined comparison."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression(node: AST.BinaryExpression, { sourceFile }) {
					const operator = node.operatorToken.kind;
					if (
						operator !== SyntaxKind.EqualsEqualsEqualsToken &&
						operator !== SyntaxKind.ExclamationEqualsEqualsToken &&
						operator !== SyntaxKind.EqualsEqualsToken &&
						operator !== SyntaxKind.ExclamationEqualsToken
					) {
						return;
					}

					let hasTypeofUndefined = false;

					if (
						node.left.kind === SyntaxKind.TypeOfExpression &&
						node.right.kind === SyntaxKind.StringLiteral &&
						node.right.text === "undefined"
					) {
						hasTypeofUndefined = true;
					} else if (
						node.right.kind === SyntaxKind.TypeOfExpression &&
						node.left.kind === SyntaxKind.StringLiteral &&
						node.left.text === "undefined"
					) {
						hasTypeofUndefined = true;
					}

					if (!hasTypeofUndefined) {
						return;
					}

					context.report({
						message: "directComparison",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});

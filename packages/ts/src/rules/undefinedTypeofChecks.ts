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
			primary: "This `typeof` comparison can be simplified to `=== undefined`.",
			secondary: [
				"Checking whether a value is `undefined` can be done either with a `typeof` check or an equality comparison.",
				"Both amount to the same in modern code that does not override the global `undefined` value.",
			],
			suggestions: ["Replace with a direct `undefined` comparison."],
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

					let typeofExpression: AST.Expression | undefined;

					if (
						node.left.kind === SyntaxKind.TypeOfExpression &&
						node.right.kind === SyntaxKind.StringLiteral &&
						node.right.text === "undefined"
					) {
						typeofExpression = node.left.expression;
					} else if (
						node.right.kind === SyntaxKind.TypeOfExpression &&
						node.left.kind === SyntaxKind.StringLiteral &&
						node.left.text === "undefined"
					) {
						typeofExpression = node.right.expression;
					}

					if (!typeofExpression) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);
					const expressionText = typeofExpression.getText(sourceFile);
					const operatorText = node.operatorToken.getText(sourceFile);

					context.report({
						fix: {
							range,
							text: `${expressionText} ${operatorText} undefined`,
						},
						message: "directComparison",
						range,
					});
				},
			},
		};
	},
});

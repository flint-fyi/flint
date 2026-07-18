import ts from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isLiteralValue(node: AST.AnyNode) {
	if (node.kind === ts.SyntaxKind.PrefixUnaryExpression) {
		return isLiteralValue(node.operand);
	}

	return (
		node.kind === ts.SyntaxKind.TrueKeyword ||
		node.kind === ts.SyntaxKind.FalseKeyword ||
		node.kind === ts.SyntaxKind.NullKeyword ||
		ts.isLiteralExpression(node)
	);
}

function isThisLiteralAssignment(node: AST.BinaryExpression) {
	return (
		(node.left.kind === ts.SyntaxKind.ElementAccessExpression ||
			node.left.kind === ts.SyntaxKind.PropertyAccessExpression) &&
		node.left.kind === ts.SyntaxKind.PropertyAccessExpression &&
		node.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
		isLiteralValue(node.right)
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports assigning literal values to `this` in constructors instead of using class field declarations.",
		id: "classFieldDeclarations",
		presets: ["javascript"],
	},
	messages: {
		preferClassField: {
			primary:
				"Prefer class field declaration over `this` assignment in constructor for static values.",
			secondary: [
				"Class field declarations are more concise and clearly express the intent of initializing properties.",
				"Moving property initialization to class fields keeps the constructor focused on dynamic initialization logic.",
			],
			suggestions: [
				"Move this property assignment to a class field declaration.",
			],
		},
	},
	setup(context) {
		function checkStatement(node: AST.Statement, sourceFile: AST.SourceFile) {
			if (
				node.kind !== ts.SyntaxKind.ExpressionStatement ||
				node.expression.kind !== ts.SyntaxKind.BinaryExpression ||
				node.expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
				!isThisLiteralAssignment(node.expression)
			) {
				return;
			}

			context.report({
				message: "preferClassField",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		return {
			visitors: {
				Constructor: (node, { sourceFile }) => {
					if (!node.body) {
						return;
					}

					for (const statement of node.body.statements) {
						checkStatement(statement, sourceFile);
					}
				},
			},
		};
	},
});

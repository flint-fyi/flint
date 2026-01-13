import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

function isLiteralValue(node: AST.AnyNode) {
	if (ts.isPrefixUnaryExpression(node)) {
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
		(ts.isElementAccessExpression(node.left) ||
			ts.isPropertyAccessExpression(node.left)) &&
		ts.isPropertyAccessExpression(node.left) &&
		node.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
		isLiteralValue(node.right)
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports assigning literal values to `this` in constructors instead of using class field declarations.",
		id: "classFieldDeclarations",
		preset: "untyped",
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
		function checkStatement(node: AST.Statement, sourceFile: ts.SourceFile) {
			if (
				!ts.isExpressionStatement(node) ||
				!ts.isBinaryExpression(node.expression) ||
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
					if (
						!node.body ||
						(!ts.isClassDeclaration(node.parent) &&
							!ts.isClassExpression(node.parent))
					) {
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

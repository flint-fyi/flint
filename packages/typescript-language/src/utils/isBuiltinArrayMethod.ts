import ts from "typescript";

import type { AST, Checker } from "@flint.fyi/typescript-language";

export type BuiltInArrayMethodNode = AST.CallExpression & {
	expression: AST.PropertyAccessExpression & {
		expression: ts.Expression;
	};
};

export function isBuiltinArrayMethod(
	name: string,
	node: AST.CallExpression,
	typeChecker: Checker,
): node is BuiltInArrayMethodNode {
	return (
		node.expression.kind === ts.SyntaxKind.PropertyAccessExpression &&
		node.expression.name.text === name &&
		typeChecker.isArrayType(
			typeChecker.getTypeAtLocation(node.expression.expression),
		) &&
		node.parent.kind !== ts.SyntaxKind.ExpressionStatement
	);
}

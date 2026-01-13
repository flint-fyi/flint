import ts from "typescript";

import type { AST, Checker } from "../index.ts";

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
		ts.isPropertyAccessExpression(node.expression) &&
		node.expression.name.text === name &&
		typeChecker.isArrayType(
			typeChecker.getTypeAtLocation(node.expression.expression),
		) &&
		!ts.isExpressionStatement(node.parent)
	);
}

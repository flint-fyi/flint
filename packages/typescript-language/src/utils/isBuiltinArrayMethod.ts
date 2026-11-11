import type { AST, Checker } from "@flint.fyi/typescript-language";

import { SyntaxKind } from "../native/ast.ts";

export type BuiltInArrayMethodNode = AST.CallExpression & {
	expression: AST.PropertyAccessExpression & {
		expression: AST.Expression;
	};
};

export function isBuiltinArrayMethod(
	name: string,
	node: AST.CallExpression,
	typeChecker: Checker,
): node is BuiltInArrayMethodNode {
	const expression = node.expression;
	return (
		expression.kind === SyntaxKind.PropertyAccessExpression &&
		expression.name.text === name &&
		typeChecker.isArrayType(
			typeChecker.getTypeAtLocation(expression.expression),
		) &&
		node.parent.kind !== SyntaxKind.ExpressionStatement
	);
}

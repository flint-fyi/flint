import type { AST } from "@flint.fyi/typescript-language";
import ts from "typescript";

export function getFunctionName(
	node:
		| AST.ArrowFunction
		| AST.FunctionDeclaration
		| AST.FunctionExpression
		| AST.MethodDeclaration
		| AST.MethodSignature,
) {
	switch (node.kind) {
		case ts.SyntaxKind.ArrowFunction: {
			return ts.isVariableDeclaration(node.parent) &&
				ts.isIdentifier(node.parent.name)
				? node.parent.name.text
				: undefined;
		}

		case ts.SyntaxKind.FunctionDeclaration:
		case ts.SyntaxKind.FunctionExpression:
			return node.name?.text;

		case ts.SyntaxKind.MethodDeclaration:
		case ts.SyntaxKind.MethodSignature:
			return ts.isIdentifier(node.name) ? node.name.text : undefined;

		default:
			return undefined;
	}
}

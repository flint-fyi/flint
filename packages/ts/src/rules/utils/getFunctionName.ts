import ts from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

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
			return node.parent.kind === ts.SyntaxKind.VariableDeclaration &&
				node.parent.name.kind === ts.SyntaxKind.Identifier
				? node.parent.name.text
				: undefined;
		}

		case ts.SyntaxKind.FunctionDeclaration:
		case ts.SyntaxKind.FunctionExpression:
			return node.name?.text;

		case ts.SyntaxKind.MethodDeclaration:
		case ts.SyntaxKind.MethodSignature:
			return node.name.kind === ts.SyntaxKind.Identifier
				? node.name.text
				: undefined;

		default:
			return undefined;
	}
}

import { SyntaxKind } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function getFunctionName(
	node:
		| AST.ArrowFunction
		| AST.FunctionDeclaration
		| AST.FunctionExpression
		| AST.MethodDeclaration
		| AST.MethodSignature,
): string | undefined {
	switch (node.kind) {
		case SyntaxKind.ArrowFunction: {
			return node.parent.kind === SyntaxKind.VariableDeclaration &&
				node.parent.name.kind === SyntaxKind.Identifier
				? node.parent.name.text
				: undefined;
		}

		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
			return node.name?.text;

		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.MethodSignature:
			return node.name.kind === SyntaxKind.Identifier
				? node.name.text
				: undefined;

		default:
			return;
	}
}

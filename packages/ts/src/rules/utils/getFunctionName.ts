import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "@flint.fyi/typescript-language/native/ast";

export function getFunctionName(
	node:
		| AST.ArrowFunction
		| AST.FunctionDeclaration
		| AST.FunctionExpression
		| AST.MethodDeclaration
		| AST.MethodSignatureDeclaration,
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

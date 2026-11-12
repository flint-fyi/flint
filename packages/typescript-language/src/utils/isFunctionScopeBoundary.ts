import { SyntaxKind } from "typescript-native/ast";

import type * as AST from "../types/ast.ts";

export function isFunctionScopeBoundary(node: AST.AnyNode): boolean {
	switch (node.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.CallSignature:
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.ClassExpression:
		case SyntaxKind.Constructor:
		case SyntaxKind.ConstructorType:
		case SyntaxKind.ConstructSignature:
		case SyntaxKind.EnumDeclaration:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.FunctionType:
		case SyntaxKind.GetAccessor:
		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.MethodSignature:
		case SyntaxKind.ModuleDeclaration:
		case SyntaxKind.SetAccessor:
			return true;
		case SyntaxKind.SourceFile:
			return !!node.externalModuleIndicator;
		default:
			return false;
	}
}

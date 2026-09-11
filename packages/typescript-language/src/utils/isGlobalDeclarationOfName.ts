import { SyntaxKind, type Node, type Program } from "typescript";

import type { Checker } from "@flint.fyi/typescript-language";

import type * as AST from "../types/ast.ts";
import { declarationIncludesGlobal } from "./declarationIncludesGlobal.ts";

/**
 * TODO: Use a scope analyzer (#400).
 */
export function isGlobalDeclarationOfName(
	node: Node,
	name: string,
	typeChecker: Checker,
	program: Program,
): boolean {
	const declarations = typeChecker.getSymbolAtLocation(node)?.getDeclarations();
	if (!declarations) {
		return false;
	}

	return declarations.every((tsDeclaration) => {
		const declaration = tsDeclaration as AST.AnyNode;

		// Special case: a variable set to a known identifier. E.g.:
		// const CustomFunction = Function;
		if (
			declaration.kind === SyntaxKind.VariableDeclaration &&
			declaration.initializer?.kind === SyntaxKind.Identifier
		) {
			return isGlobalDeclarationOfName(
				declaration.initializer,
				name,
				typeChecker,
				program,
			);
		}

		// Special case: a property of an interface
		if (declaration.kind === SyntaxKind.PropertySignature) {
			return isGlobalDeclarationOfName(
				declaration.parent,
				name,
				typeChecker,
				program,
			);
		}

		return (
			isDeclarationOfName(declaration, name) &&
			declarationIncludesGlobal(tsDeclaration, program)
		);
	});
}

function isDeclarationOfName(node: AST.AnyNode, name: string) {
	switch (node.kind) {
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.InterfaceDeclaration:
		case SyntaxKind.VariableDeclaration:
			return (
				node.name?.kind === SyntaxKind.Identifier && node.name.text === name
			);

		default:
			return false;
	}
}

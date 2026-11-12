import { SyntaxKind } from "typescript-native/ast";
import type { Program } from "typescript-native/sync";

import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { declarationIncludesGlobal } from "./declarationIncludesGlobal.ts";
import { resolveDeclarations } from "./resolveDeclarations.ts";

/**
 * TODO: Use a scope analyzer (#400).
 */
export function isGlobalDeclarationOfName(
	node: AST.AnyNode,
	name: string,
	typeChecker: Checker,
	program: Program,
): boolean {
	const handles = typeChecker.getSymbolAtLocation(node)?.declarations;
	if (!handles?.length) {
		return false;
	}

	const declarations = resolveDeclarations(handles);
	if (!declarations) {
		return false;
	}

	return declarations.every((declaration) => {
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
			declarationIncludesGlobal(declaration, program)
		);
	});
}

function isDeclarationOfName(node: AST.Declaration, name: string): boolean {
	switch (node.kind) {
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.InterfaceDeclaration:
		case SyntaxKind.VariableDeclaration:
			return (
				node.name?.kind === SyntaxKind.Identifier && node.name.text === name
			);
	}

	return false;
}

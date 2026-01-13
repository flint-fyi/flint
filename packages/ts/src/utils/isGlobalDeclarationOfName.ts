import ts from "typescript";

import type { Checker } from "../types/checker.ts";
import { declarationIncludesGlobal } from "./declarationIncludesGlobal.ts";

/**
 * TODO: Use a scope analyzer (#400).
 */
export function isGlobalDeclarationOfName(
	node: ts.Node,
	name: string,
	typeChecker: Checker,
): boolean {
	const declarations = typeChecker.getSymbolAtLocation(node)?.getDeclarations();
	if (!declarations) {
		return false;
	}

	return declarations.every((declaration) => {
		// Special case: a variable set to a known identifier. E.g.:
		// const CustomFunction = Function;
		if (
			ts.isVariableDeclaration(declaration) &&
			declaration.initializer &&
			ts.isIdentifier(declaration.initializer)
		) {
			return isGlobalDeclarationOfName(
				declaration.initializer,
				name,
				typeChecker,
			);
		}

		// Special case: a property of an interface
		if (ts.isPropertySignature(declaration)) {
			return isGlobalDeclarationOfName(declaration.parent, name, typeChecker);
		}

		return (
			isDeclarationOfName(declaration, name) &&
			declarationIncludesGlobal(declaration)
		);
	});
}

function isDeclarationOfName(node: ts.Declaration, name: string) {
	if (
		ts.isClassDeclaration(node) ||
		ts.isFunctionDeclaration(node) ||
		ts.isInterfaceDeclaration(node) ||
		ts.isVariableDeclaration(node)
	) {
		return node.name && ts.isIdentifier(node.name) && node.name.text === name;
	}

	return false;
}

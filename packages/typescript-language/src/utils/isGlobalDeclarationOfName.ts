import type { Declaration, Node, Program } from "typescript";

import type { Checker } from "@flint.fyi/typescript-language";

import {
	isClassDeclaration,
	isFunctionDeclaration,
	isIdentifier,
	isInterfaceDeclaration,
	isPropertySignature,
	isVariableDeclaration,
} from "../typescript.ts";
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

	return declarations.every((declaration) => {
		// Special case: a variable set to a known identifier. E.g.:
		// const CustomFunction = Function;
		if (
			isVariableDeclaration(declaration) &&
			declaration.initializer &&
			isIdentifier(declaration.initializer)
		) {
			return isGlobalDeclarationOfName(
				declaration.initializer,
				name,
				typeChecker,
				program,
			);
		}

		// Special case: a property of an interface
		if (isPropertySignature(declaration)) {
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

function isDeclarationOfName(node: Declaration, name: string) {
	if (
		isClassDeclaration(node) ||
		isFunctionDeclaration(node) ||
		isInterfaceDeclaration(node) ||
		isVariableDeclaration(node)
	) {
		return node.name && isIdentifier(node.name) && node.name.text === name;
	}

	return false;
}

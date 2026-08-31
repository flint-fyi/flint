import {
	isImportSpecifier,
	isNamespaceImport,
	isImportDeclaration as isNativeImportDeclaration,
	isStringLiteral,
	type Node,
} from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function isImportedBindingFromModule(
	declaration: Node,
	moduleName: string,
): declaration is AST.ImportSpecifier | AST.NamespaceImport {
	if (!isImportSpecifier(declaration) && !isNamespaceImport(declaration)) {
		return false;
	}

	const importDeclaration = isImportSpecifier(declaration)
		? declaration.parent.parent.parent
		: declaration.parent.parent;

	return (
		isImportDeclaration(importDeclaration) &&
		importDeclaration.moduleSpecifier.text === moduleName
	);
}

export function isImportedSpecifierFromModule(
	declaration: Node,
	moduleName: string,
	importedName: string,
): declaration is AST.ImportSpecifier {
	if (
		!isImportSpecifier(declaration) ||
		!isImportedBindingFromModule(declaration, moduleName)
	) {
		return false;
	}

	return (
		(declaration.propertyName?.text ?? declaration.name.text) === importedName
	);
}

function isImportDeclaration(
	node: Node,
): node is AST.ImportDeclaration & { moduleSpecifier: AST.StringLiteral } {
	return (
		isNativeImportDeclaration(node) && isStringLiteral(node.moduleSpecifier)
	);
}

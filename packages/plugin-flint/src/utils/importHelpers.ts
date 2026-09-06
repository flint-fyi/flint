import { SyntaxKind, type Node } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function isImportedBindingFromModule(
	declaration: Node,
	moduleName: string,
): declaration is AST.ImportSpecifier | AST.NamespaceImport {
	if (
		declaration.kind !== SyntaxKind.ImportSpecifier &&
		declaration.kind !== SyntaxKind.NamespaceImport
	) {
		return false;
	}

	const importDeclaration =
		declaration.kind === SyntaxKind.ImportSpecifier
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
		declaration.kind !== SyntaxKind.ImportSpecifier ||
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
		node.kind === SyntaxKind.ImportDeclaration &&
		node.moduleSpecifier.kind === SyntaxKind.StringLiteral
	);
}

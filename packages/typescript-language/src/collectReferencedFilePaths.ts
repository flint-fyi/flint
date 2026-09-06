import * as path from "node:path";

import { SyntaxKind } from "typescript-native/unstable/ast";
import type { Checker, Program } from "typescript-native/unstable/sync";

import type * as AST from "./types/ast.ts";
import { forEachChild } from "./utils/forEachChild.ts";

export function collectReferencedFilePaths(
	program: Program,
	typeChecker: Checker,
	sourceFile: AST.SourceFile,
): string[] {
	const modulePaths = new Set<string>();

	function addModuleSpecifier(moduleSpecifier: AST.StringLiteral): void {
		const symbol = typeChecker.getSymbolAtLocation(moduleSpecifier);
		if (!symbol) {
			return;
		}

		for (const declarationHandle of symbol.declarations) {
			const declaration = declarationHandle.resolve();
			const declarationSourceFile = declaration?.getSourceFile();
			if (
				declarationSourceFile &&
				!program.isSourceFileFromExternalLibrary(declarationSourceFile)
			) {
				modulePaths.add(
					path.relative(process.cwd(), declarationSourceFile.fileName),
				);
			}
		}
	}

	function visit(node: AST.AnyNode): void {
		const moduleSpecifier = getModuleSpecifierNode(node);
		if (moduleSpecifier !== undefined) {
			addModuleSpecifier(moduleSpecifier);
		}
		forEachChild(node, visit);
	}

	visit(sourceFile);
	return [...modulePaths];
}

function getModuleSpecifierNode(
	node: AST.AnyNode,
): AST.StringLiteral | undefined {
	if (
		node.kind === SyntaxKind.ImportDeclaration &&
		node.moduleSpecifier.kind === SyntaxKind.StringLiteral
	) {
		return node.moduleSpecifier;
	}

	// Re-exports (`export * from "y"`, `export { a } from "y"`) pull in another
	// module just as imports do, so they must invalidate the cache too.
	if (
		node.kind === SyntaxKind.ExportDeclaration &&
		node.moduleSpecifier?.kind === SyntaxKind.StringLiteral
	) {
		return node.moduleSpecifier;
	}

	if (
		node.kind === SyntaxKind.ImportEqualsDeclaration &&
		node.moduleReference.kind === SyntaxKind.ExternalModuleReference &&
		node.moduleReference.expression.kind === SyntaxKind.StringLiteral
	) {
		return node.moduleReference.expression;
	}

	if (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.ImportKeyword &&
		node.arguments[0]?.kind === SyntaxKind.StringLiteral
	) {
		return node.arguments[0];
	}

	if (
		node.kind === SyntaxKind.ImportType &&
		node.argument.kind === SyntaxKind.LiteralType &&
		node.argument.literal.kind === SyntaxKind.StringLiteral
	) {
		return node.argument.literal;
	}

	return undefined;
}

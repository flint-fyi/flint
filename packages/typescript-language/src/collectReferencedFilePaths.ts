import * as path from "node:path";

import ts, { SyntaxKind } from "typescript";

import type * as AST from "./types/ast.ts";
import { forEachChild } from "./utils/forEachChild.ts";

export function collectReferencedFilePaths(
	program: ts.Program,
	sourceFile: AST.SourceFile,
): string[] {
	const modulePaths = new Set<string>();

	function resolveModulePath(moduleSpecifier: string): string | undefined {
		const resolved = ts.resolveModuleName(
			moduleSpecifier,
			sourceFile.fileName,
			program.getCompilerOptions(),
			// TODO: Eventually, the file system should be abstracted
			// https://github.com/flint-fyi/flint/issues/73
			ts.sys,
		);

		if (resolved.resolvedModule?.isExternalLibraryImport === false) {
			return path.relative(
				program.getCurrentDirectory(),
				resolved.resolvedModule.resolvedFileName,
			);
		}
		return undefined;
	}

	function visit(node: AST.AnyNode) {
		let path: string | undefined;

		if (isImportDeclaration(node)) {
			// import { x } from "./foo";
			path = node.moduleSpecifier.text;
		} else if (isExportDeclaration(node)) {
			// export { x } from "./foo"; or export * from "./foo";
			path = node.moduleSpecifier.text;
		} else if (isImportCall(node)) {
			// const x = import("./foo")
			path = node.arguments[0].text;
		} else if (isAwaitImportCall(node)) {
			// const x = await import("./foo")
			path = node.expression.arguments[0].text;
		} else if (isImportTypeNode(node)) {
			// type T = import("./foo") or type T = typeof import("./foo");
			path = node.argument.literal.text;
		}

		const resolvedPath = path && resolveModulePath(path);
		if (resolvedPath) {
			modulePaths.add(resolvedPath);
		}

		forEachChild(node, visit);
	}

	visit(sourceFile);

	return Array.from(modulePaths);
}

function isAwaitImportCall(node: AST.AnyNode): node is AST.AwaitExpression & {
	expression: AST.CallExpression & { arguments: [AST.StringLiteral] };
} {
	return (
		node.kind === SyntaxKind.AwaitExpression && isImportCall(node.expression)
	);
}

function isExportDeclaration(
	node: AST.AnyNode,
): node is AST.ExportDeclaration & { moduleSpecifier: AST.StringLiteral } {
	return (
		node.kind === SyntaxKind.ExportDeclaration &&
		node.moduleSpecifier?.kind === SyntaxKind.StringLiteral
	);
}

function isImportCall(
	node: AST.AnyNode,
): node is AST.CallExpression & { arguments: [AST.StringLiteral] } {
	return (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.ImportKeyword &&
		node.arguments[0]?.kind === SyntaxKind.StringLiteral
	);
}

function isImportDeclaration(
	node: AST.AnyNode,
): node is AST.ImportDeclaration & { moduleSpecifier: AST.StringLiteral } {
	return (
		node.kind === SyntaxKind.ImportDeclaration &&
		node.moduleSpecifier.kind === SyntaxKind.StringLiteral
	);
}

function isImportTypeNode(node: AST.AnyNode): node is AST.ImportTypeNode & {
	argument: AST.LiteralTypeNode & { literal: AST.StringLiteral };
} {
	return (
		node.kind === SyntaxKind.ImportType &&
		node.argument.kind === SyntaxKind.LiteralType &&
		node.argument.literal.kind === SyntaxKind.StringLiteral
	);
}

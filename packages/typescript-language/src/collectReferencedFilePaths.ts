import * as path from "node:path";

import type ts from "typescript";

import { nullThrows } from "@flint.fyi/utils";

import tsutils from "./ts-api-utils.ts";
import type * as AST from "./types/ast.ts";
import typescript from "./typescript.ts";

export function collectReferencedFilePaths(
	program: ts.Program,
	sourceFile: AST.SourceFile,
): string[] {
	const modulePaths = new Set<string>();

	function resolveModulePath(moduleSpecifier: string): string | undefined {
		const resolved = typescript.resolveModuleName(
			moduleSpecifier,
			sourceFile.fileName,
			program.getCompilerOptions(),
			// TODO: Eventually, the file system should be abstracted
			// https://github.com/flint-fyi/flint/issues/73
			typescript.sys,
		);

		if (resolved.resolvedModule?.isExternalLibraryImport === false) {
			return path.relative(
				process.cwd(),
				resolved.resolvedModule.resolvedFileName,
			);
		}
		return undefined;
	}

	function visit(node: ts.Node) {
		let path: string | undefined;

		if (isImportDeclaration(node)) {
			// import { x } from "./foo";
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

		typescript.forEachChild(node, visit);
	}

	visit(sourceFile);

	return Array.from(modulePaths);
}

function isAwaitImportCall(node: ts.Node): node is AST.AwaitExpression & {
	expression: ts.CallExpression & { arguments: [ts.StringLiteral] };
} {
	return typescript.isAwaitExpression(node) && isImportCall(node.expression);
}

function isImportCall(
	node: ts.Node,
): node is ts.CallExpression & { arguments: [ts.StringLiteral] } {
	return (
		typescript.isCallExpression(node) &&
		tsutils.isImportExpression(node.expression) &&
		!!node.arguments.length &&
		typescript.isStringLiteral(
			nullThrows(
				node.arguments[0],
				"First argument is expected to be present by prior length check",
			),
		)
	);
}

function isImportDeclaration(
	node: ts.Node,
): node is AST.ImportDeclaration & { moduleSpecifier: AST.StringLiteral } {
	return (
		typescript.isImportDeclaration(node) &&
		typescript.isStringLiteral(node.moduleSpecifier)
	);
}

function isImportTypeNode(node: ts.Node): node is ts.ImportTypeNode & {
	argument: ts.LiteralTypeNode & { literal: ts.StringLiteral };
} {
	return (
		typescript.isImportTypeNode(node) &&
		typescript.isLiteralTypeNode(node.argument) &&
		typescript.isStringLiteral(node.argument.literal)
	);
}

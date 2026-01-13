import { nullThrows } from "@flint.fyi/utils";
import * as path from "node:path";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import type * as AST from "./types/ast.ts";

export function collectReferencedFilePaths(
	program: ts.Program,
	sourceFile: ts.SourceFile,
) {
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

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	return Array.from(modulePaths);
}

function isAwaitImportCall(node: ts.Node): node is AST.AwaitExpression & {
	expression: ts.CallExpression & { arguments: [ts.StringLiteral] };
} {
	return ts.isAwaitExpression(node) && isImportCall(node.expression);
}

function isImportCall(
	node: ts.Node,
): node is ts.CallExpression & { arguments: [ts.StringLiteral] } {
	return (
		ts.isCallExpression(node) &&
		tsutils.isImportExpression(node.expression) &&
		node.arguments.length > 0 &&
		ts.isStringLiteral(
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
		ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)
	);
}

function isImportTypeNode(node: ts.Node): node is ts.ImportTypeNode & {
	argument: ts.LiteralTypeNode & { literal: ts.StringLiteral };
} {
	return (
		ts.isImportTypeNode(node) &&
		ts.isLiteralTypeNode(node.argument) &&
		ts.isStringLiteral(node.argument.literal)
	);
}

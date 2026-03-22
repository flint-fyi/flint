import { nullThrows } from "@flint.fyi/utils";
import * as path from "node:path";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import type * as AST from "./types/ast.ts";

export function collectReferencedFilePaths(
	host: ts.ModuleResolutionHost,
	program: ts.Program,
	sourceFile: AST.SourceFile,
) {
	const modulePaths = new Set<string>();
	const cwd = host.getCurrentDirectory?.() ?? process.cwd();
	const compilerOptions = program.getCompilerOptions();
	const useCaseSensitiveFileNames =
		host.useCaseSensitiveFileNames ?? ts.sys.useCaseSensitiveFileNames;
	const getCanonicalFileName = (fileName: string) =>
		useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
	const moduleResolutionCache = ts.createModuleResolutionCache(
		cwd,
		getCanonicalFileName,
		compilerOptions,
	);
	const referencedProjectFiles = collectReferencedProjectFiles(program);

	function resolveModulePath(
		moduleSpecifier: ts.StringLiteralLike,
	): string | undefined {
		const resolved = ts.resolveModuleName(
			moduleSpecifier.text,
			sourceFile.fileName,
			compilerOptions,
			host,
			moduleResolutionCache,
			undefined,
			program.getModeForUsageLocation(sourceFile, moduleSpecifier),
		);

		if (resolved.resolvedModule === undefined) {
			return undefined;
		}

		const { resolvedFileName } = resolved.resolvedModule;

		if (
			resolved.resolvedModule.isExternalLibraryImport === false ||
			referencedProjectFiles.has(resolvedFileName) ||
			!isNodeModulesPath(resolvedFileName)
		) {
			return path.relative(cwd, resolvedFileName);
		}

		return undefined;
	}

	function visit(node: ts.Node) {
		let moduleSpecifier: ts.StringLiteralLike | undefined;

		if (isImportDeclaration(node)) {
			// import { x } from "./foo";
			moduleSpecifier = node.moduleSpecifier;
		} else if (isImportCall(node)) {
			// const x = import("./foo")
			moduleSpecifier = node.arguments[0];
		} else if (isAwaitImportCall(node)) {
			// const x = await import("./foo")
			moduleSpecifier = node.expression.arguments[0];
		} else if (isImportTypeNode(node)) {
			// type T = import("./foo") or type T = typeof import("./foo");
			moduleSpecifier = node.argument.literal;
		}

		const resolvedPath = moduleSpecifier && resolveModulePath(moduleSpecifier);
		if (resolvedPath) {
			modulePaths.add(resolvedPath);
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	return Array.from(modulePaths);
}

function collectReferencedProjectFiles(
	program: ts.Program,
): ReadonlySet<string> {
	const referencedFiles = new Set<string>();
	const pendingReferences = [...(program.getResolvedProjectReferences() ?? [])];

	for (const reference of pendingReferences) {
		if (reference == null) {
			continue;
		}

		for (const fileName of reference.commandLine.fileNames) {
			referencedFiles.add(fileName);
		}

		if (reference.references) {
			pendingReferences.push(...reference.references);
		}
	}

	return referencedFiles;
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
		!!node.arguments.length &&
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

function isNodeModulesPath(filePath: string) {
	return filePath.split(path.sep).includes("node_modules");
}

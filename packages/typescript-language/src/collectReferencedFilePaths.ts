import { join } from "pathe";
import type ts from "typescript";
import { SyntaxKind } from "typescript";

import { getModuleLookups } from "./getModuleLookups.ts";
import type * as AST from "./types/ast.ts";
import { forEachChild } from "./utils/forEachChild.ts";

export interface ReferencedFilePaths {
	/**
	 * Workspace modules the file imports, and existing files that decide how its imports resolve.
	 */
	dependencies: Set<string>;

	/**
	 * Paths module resolution checks before an import's result, and that don't exist.
	 */
	missingDependencies: Set<string>;
}

export function collectReferencedFilePaths(
	program: ts.Program,
	sourceFile: AST.SourceFile,
	moduleResolutionHost: ts.ModuleResolutionHost,
): ReferencedFilePaths {
	const compilerOptions = program.getCompilerOptions();
	const dependencies = new Set<string>();
	const missingDependencies = new Set<string>();

	function resolveModule(
		moduleSpecifier: AST.NoSubstitutionTemplateLiteral | AST.StringLiteral,
	): void {
		// The program's own resolution includes its host's, such as Volar's for `.vue` files.
		const resolvedModule = program.getResolvedModuleFromModuleSpecifier(
			moduleSpecifier,
			sourceFile,
		)?.resolvedModule;
		const resolvedPath =
			resolvedModule &&
			(resolvedModule.originalPath ?? resolvedModule.resolvedFileName);

		if (resolvedModule?.isExternalLibraryImport === false) {
			dependencies.add(resolvedModule.resolvedFileName);
		}

		for (const lookup of getModuleLookups(
			moduleSpecifier.text,
			sourceFile.fileName,
			compilerOptions,
			(packageDirectory) =>
				!!moduleResolutionHost.directoryExists?.(packageDirectory) &&
				!moduleResolutionHost.fileExists(
					join(packageDirectory, "package.json"),
				),
		)) {
			// Reaching the result here means no package.json decided it, so the file itself is what can change.
			if (lookup.path === resolvedPath) {
				dependencies.add(resolvedPath);
				return;
			}
			if (!moduleResolutionHost.fileExists(lookup.path)) {
				missingDependencies.add(lookup.path);
				continue;
			}
			dependencies.add(lookup.path);
			if (lookup.scope && resolvedPath?.startsWith(`${lookup.scope}/`)) {
				return;
			}
		}
	}

	function visit(node: AST.AnyNode) {
		if (isImportDeclaration(node)) {
			// import { x } from "./foo";
			resolveModule(node.moduleSpecifier);
		} else if (isExportDeclaration(node)) {
			// export { x } from "./foo"; or export * from "./foo";
			resolveModule(node.moduleSpecifier);
		} else if (isImportCall(node)) {
			// import("./foo"), wherever it appears, such as after await or inside Promise.all
			resolveModule(node.arguments[0]);
		} else if (isImportTypeNode(node)) {
			// type T = import("./foo") or type T = typeof import("./foo");
			resolveModule(node.argument.literal);
		}

		forEachChild(node, visit);
	}

	visit(sourceFile);

	return { dependencies, missingDependencies };
}

function isExportDeclaration(
	node: AST.AnyNode,
): node is AST.ExportDeclaration & { moduleSpecifier: AST.StringLiteral } {
	return (
		node.kind === SyntaxKind.ExportDeclaration &&
		node.moduleSpecifier?.kind === SyntaxKind.StringLiteral
	);
}

function isImportCall(node: AST.AnyNode): node is AST.CallExpression & {
	arguments: [AST.NoSubstitutionTemplateLiteral | AST.StringLiteral];
} {
	return (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.ImportKeyword &&
		(node.arguments[0]?.kind === SyntaxKind.StringLiteral ||
			node.arguments[0]?.kind === SyntaxKind.NoSubstitutionTemplateLiteral)
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

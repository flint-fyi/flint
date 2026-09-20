import * as path from "node:path";

import { SyntaxKind } from "typescript-native/unstable/ast";
import type { Checker, Program } from "typescript-native/unstable/sync";

import type * as AST from "./types/ast.ts";
import { forEachChild } from "./utils/forEachChild.ts";

// A program's root files, keyed by the canonical path its node handles carry.
// Roots are the files a config names directly, so none of them was found by
// searching node_modules: they can be reported as dependencies without
// asking the native process about them, or fetching their trees.
const rootFileNamesByProgram = new WeakMap<Program, Map<string, string>>();

export function collectReferencedFilePaths(
	program: Program,
	typeChecker: Checker,
	sourceFile: AST.SourceFile,
): string[] {
	const modulePaths = new Set<string>();
	const rootFileNamesByPath = getRootFileNamesByPath(program);

	function addModuleSpecifier(moduleSpecifier: AST.StringLiteral): void {
		const symbol = typeChecker.getSymbolAtLocation(moduleSpecifier);
		if (!symbol) {
			return;
		}

		for (const declarationHandle of symbol.declarations) {
			const rootFileName = rootFileNamesByPath.get(declarationHandle.path);
			if (rootFileName !== undefined) {
				modulePaths.add(path.relative(process.cwd(), rootFileName));
				continue;
			}
			if (
				program.getSourceFileMetadataByPath(declarationHandle.path)
					?.isFromExternalLibrary !== false
			) {
				continue;
			}
			const declarationSourceFile = declarationHandle
				.resolve()
				?.getSourceFile();
			if (declarationSourceFile) {
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

function getRootFileNamesByPath(program: Program): Map<string, string> {
	let rootFileNamesByPath = rootFileNamesByProgram.get(program);
	if (!rootFileNamesByPath) {
		rootFileNamesByPath = new Map(
			program
				.getProject()
				.parsedCommandLine.fileNames.map((fileName) => [
					program.getCanonicalFileName(fileName),
					fileName,
				]),
		);
		rootFileNamesByProgram.set(program, rootFileNamesByPath);
	}
	return rootFileNamesByPath;
}

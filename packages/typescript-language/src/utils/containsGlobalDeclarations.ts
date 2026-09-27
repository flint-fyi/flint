import { SyntaxKind } from "typescript-native/unstable/ast";

import type * as AST from "../types/ast.ts";

/**
 * Inspects top-level statements of a TS source file to determine
 * if it introduces or modifies entities in the global scope.
 */
export function containsGlobalDeclarations(
	sourceFileNode: AST.SourceFile,
): boolean {
	const isModule = !!sourceFileNode.externalModuleIndicator;

	return sourceFileNode.statements.some((statement) => {
		// Checks for 'declare global {}'
		if (statement.kind === SyntaxKind.ModuleDeclaration) {
			const declaration = statement;
			if (declaration.name.text === "global") {
				return true;
			}
		}

		// In a module file, bare `declare` statements are local to the module
		if (isModule) {
			return false;
		}

		// In a script file, top-level `declare` statements affect the global scope
		return (
			"modifiers" in statement &&
			(
				statement as AST.Declaration & { modifiers?: readonly AST.AnyNode[] }
			).modifiers?.some(
				(modifier) => modifier.kind === SyntaxKind.DeclareKeyword,
			) === true
		);
	});
}

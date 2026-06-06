import { getScopeManager } from "../scope/scopeManager.ts";
import type * as AST from "../types/ast.ts";

/**
 * Gets all references to a variable that modify it (assignments, increments, decrements).
 * @returns An array of identifier nodes that modify the variable.
 */
export function getModifyingReferences(
	identifier: AST.Identifier,
	sourceFile: AST.SourceFile,
) {
	const variable = getScopeManager(sourceFile).findVariable(identifier);
	if (!variable || variable.declarations.length > 1) {
		return [];
	}

	return variable.references
		.filter((reference) => reference.isWrite)
		.map((reference) => reference.identifier);
}

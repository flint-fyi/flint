import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { declarationsIncludeGlobal } from "./declarationsIncludeGlobal.ts";

/**
 * Checks if a node is a reference to a global variable (e.g., Object, undefined, NaN).
 * Global variables are those declared in TypeScript's lib files or are global identifiers
 * like undefined which have symbols but no user-defined declarations.
 * TODO: Use a scope manager (#400).
 */
export function isGlobalVariable(
	node: AST.Expression,
	typeChecker: Checker,
): boolean {
	const symbol = typeChecker.getSymbolAtLocation(node);
	if (!symbol) {
		return false;
	}

	const declarations = symbol.getDeclarations();

	// undefined, NaN, Infinity etc. may have no declarations in some contexts
	// but are still global identifiers. Check if they're global scope symbols.
	if (!declarations?.length) {
		// If there are no declarations, it's likely a built-in global like undefined
		return true;
	}

	return declarationsIncludeGlobal(declarations);
}

import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { declarationsIncludeGlobal } from "./declarationsIncludeGlobal.ts";

export function getDeclarationsIfGlobal(
	node: AST.Expression,
	typeChecker: Checker,
) {
	const declarations = typeChecker.getSymbolAtLocation(node)?.getDeclarations();

	return !!declarations && declarationsIncludeGlobal(declarations)
		? declarations
		: undefined;
}

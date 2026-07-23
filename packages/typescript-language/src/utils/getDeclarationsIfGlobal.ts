import type { Program } from "typescript";

import type { AST, Checker } from "@flint.fyi/typescript-language";

import { declarationsIncludeGlobal } from "./declarationsIncludeGlobal.ts";

export function getDeclarationsIfGlobal(
	node: AST.Expression,
	typeChecker: Checker,
	program: Program,
) {
	const declarations = typeChecker.getSymbolAtLocation(node)?.getDeclarations();

	return !!declarations && declarationsIncludeGlobal(declarations, program)
		? declarations
		: undefined;
}

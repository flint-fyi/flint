import type { Program } from "typescript-native/sync";

import type { AST, Checker } from "@flint.fyi/typescript-language";

import { declarationsIncludeGlobal } from "./declarationsIncludeGlobal.ts";

export function isGlobalDeclaration(
	node: AST.Expression,
	typeChecker: Checker,
	program: Program,
): boolean {
	const handles = typeChecker.getSymbolAtLocation(node)?.declarations;
	return !!handles && declarationsIncludeGlobal(handles, program);
}

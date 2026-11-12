import type { Program } from "typescript-native/sync";

import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { declarationsIncludeGlobal } from "./declarationsIncludeGlobal.ts";
import { resolveDeclarations } from "./resolveDeclarations.ts";

export function getDeclarationsIfGlobal(
	node: AST.Expression,
	typeChecker: Checker,
	program: Program,
): AST.Declaration[] | undefined {
	const handles = typeChecker.getSymbolAtLocation(node)?.declarations;

	return handles && declarationsIncludeGlobal(handles, program)
		? resolveDeclarations(handles)
		: undefined;
}

import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { getDeclarationsIfGlobal } from "./getDeclarationsIfGlobal.ts";

export function isGlobalDeclaration(
	node: AST.Expression,
	typeChecker: Checker,
) {
	return !!getDeclarationsIfGlobal(node, typeChecker);
}

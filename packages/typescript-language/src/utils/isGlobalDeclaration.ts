import type { AST, Checker } from "@flint.fyi/typescript-language";

import { getDeclarationsIfGlobal } from "./getDeclarationsIfGlobal.ts";

export function isGlobalDeclaration(
	node: AST.Expression,
	typeChecker: Checker,
) {
	return !!getDeclarationsIfGlobal(node, typeChecker);
}

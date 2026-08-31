import type { Program } from "typescript-native/unstable/sync";

import type { AST, Checker } from "@flint.fyi/typescript-language";

import { getDeclarationsIfGlobal } from "./getDeclarationsIfGlobal.ts";

export function isGlobalDeclaration(
	node: AST.Expression,
	checker: Checker,
	program: Program,
): boolean {
	return !!getDeclarationsIfGlobal(node, checker, program);
}

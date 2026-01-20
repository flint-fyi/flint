import type { AST, Checker } from "@flint.fyi/typescript-language";

import { isTypeFromTS } from "./isTypeFromTS.ts";

export function isTSNode(node: AST.Expression, typeChecker: Checker) {
	return isTypeFromTS(node, typeChecker, "Node");
}

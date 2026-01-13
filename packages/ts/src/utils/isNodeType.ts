import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";

export function isNodeType(node: AST.Expression, typeChecker: Checker) {
	return typeChecker.getTypeAtLocation(node).getSymbol()?.getName() === "Node";
}

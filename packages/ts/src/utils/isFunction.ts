import type { AST } from "../index.ts";
import type { Checker } from "../types/checker.ts";

export function isFunction(node: AST.Expression, typeChecker: Checker) {
	const objectType = typeChecker.getTypeAtLocation(node);
	const callSignatures = objectType.getCallSignatures();

	return !!callSignatures.length;
}

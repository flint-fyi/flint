import type { AST, Checker } from "@flint.fyi/typescript-language";

export function isFunction(node: AST.Expression, typeChecker: Checker) {
	const objectType = typeChecker.getTypeAtLocation(node);
	const callSignatures = objectType.getCallSignatures();

	return !!callSignatures.length;
}

import type { AST, Checker } from "@flint.fyi/typescript-language";

export function isFunction(node: AST.Expression, checker: Checker): boolean {
	const objectType = checker.getTypeAtLocation(node);
	const callSignatures = objectType.getCallSignatures();

	return !!callSignatures.length;
}

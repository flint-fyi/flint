import type { AST, Checker } from "@flint.fyi/typescript-language";

export function getConstrainedTypeAtLocation(
	node: AST.Expression,
	typeChecker: Checker,
) {
	const type = typeChecker.getTypeAtLocation(node);
	return typeChecker.getBaseConstraintOfType(type) ?? type;
}

import type { Type } from "typescript-native/unstable/sync";

import type { AST, Checker } from "@flint.fyi/typescript-language";

export function getConstrainedTypeAtLocation(
	node: AST.Expression,
	typeChecker: Checker,
): Type {
	const type = typeChecker.getTypeAtLocation(node);
	return typeChecker.getBaseConstraintOfType(type) ?? type;
}

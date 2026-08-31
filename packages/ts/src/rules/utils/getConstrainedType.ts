import type { Type } from "typescript-native/unstable/sync";

import type { AST, Checker } from "@flint.fyi/typescript-language";

export function getConstrainedTypeAtLocation(
	node: AST.Expression,
	checker: Checker,
): Type {
	const type = checker.getTypeAtLocation(node);
	return checker.getBaseConstraintOfType(type) ?? type;
}

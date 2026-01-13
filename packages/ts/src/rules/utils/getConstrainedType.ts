import type * as AST from "../../types/ast.ts";
import type { Checker } from "../../types/checker.ts";

export function getConstrainedTypeAtLocation(
	node: AST.Expression,
	typeChecker: Checker,
) {
	const type = typeChecker.getTypeAtLocation(node);
	return typeChecker.getBaseConstraintOfType(type) ?? type;
}

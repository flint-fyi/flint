import { TypeFlags, type Type } from "typescript-native/unstable/sync";

import type { AST, Checker } from "@flint.fyi/typescript-language";

// The only types whose base constraint can differ from the type itself:
// TypeScript's getBaseConstraintOfType resolves a constraint for these and
// for generic tuples, and answers `undefined` for everything else.
const constrainableTypeFlags =
	TypeFlags.Instantiable | TypeFlags.UnionOrIntersection;

export function getConstrainedTypeAtLocation(
	node: AST.Expression,
	typeChecker: Checker,
): Type {
	const type = typeChecker.getTypeAtLocation(node);
	// Asking the checker is a round trip to the native process, so only ask
	// when the answer can be something other than the type itself.
	if (!(type.flags & constrainableTypeFlags) && !type.isTupleType()) {
		return type;
	}
	return typeChecker.getBaseConstraintOfType(type) ?? type;
}

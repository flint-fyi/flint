import type * as ts from "typescript";

export function isTypeRecursive(
	type: ts.Type,
	predicate: (t: ts.Type) => boolean,
): boolean {
	return type.isUnionOrIntersection()
		? type.types.some((subType) => isTypeRecursive(subType, predicate))
		: predicate(type);
}

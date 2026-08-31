import type { Type } from "typescript-native/unstable/sync";

export function isTypeRecursive(
	type: Type,
	predicate: (type: Type) => boolean,
): boolean {
	if (type.isUnionType() || type.isIntersectionType()) {
		return type
			.getTypes()
			.some((subType) => isTypeRecursive(subType, predicate));
	}

	return predicate(type);
}

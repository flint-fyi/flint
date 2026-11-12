import type { Type } from "@flint.fyi/typescript-language/native/sync";

export function getIntersectionConstituents(type: Type): readonly Type[] {
	return type.isIntersectionType() ? type.getTypes() : [type];
}

export function getTypeConstituents(type: Type): readonly Type[] {
	return type.isUnionType() || type.isIntersectionType()
		? type.getTypes()
		: [type];
}

export function getUnionConstituents(type: Type): readonly Type[] {
	return type.isUnionType() ? type.getTypes() : [type];
}

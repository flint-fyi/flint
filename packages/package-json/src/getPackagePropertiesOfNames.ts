import type { DocumentNode, MemberNode } from "@humanwhocodes/momoa";

import { getPackageProperties } from "./getPackageProperties.ts";

export function getPackagePropertiesOfNames<T extends string[]>(
	rootNode: DocumentNode,
	propertyNames: T,
): Partial<Record<T[number], MemberNode>> {
	const result: Partial<Record<T[number], MemberNode>> = {};

	const properties = getPackageProperties(rootNode);
	if (!properties) {
		return result;
	}

	const propertyNameSet = new Set(propertyNames);

	const isPropertyName = (name: string): name is T[number] => {
		return propertyNameSet.has(name);
	};

	for (const property of properties) {
		if (
			property.name.type === "String" &&
			isPropertyName(property.name.value)
		) {
			result[property.name.value] = property;
		}
	}
	return result;
}

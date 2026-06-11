import type { DocumentNode, MemberNode } from "@humanwhocodes/momoa";

import { getPackageProperties } from "./getPackageProperties.ts";

export function getPackagePropertyOfName(
	rootNode: DocumentNode,
	propertyName: string,
): MemberNode | undefined {
	return getPackageProperties(rootNode)?.find(
		(property) =>
			property.name.type === "String" && property.name.value === propertyName,
	);
}

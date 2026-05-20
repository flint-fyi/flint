import type { JsonNode, JsonSourceFile } from "@flint.fyi/json-language";
import { SyntaxKind } from "typescript";

import { getPackageProperties } from "./getPackageProperties.ts";

export function* getPackagePropertiesOfNames(
	sourceFile: JsonSourceFile,
	propertyNames: ReadonlySet<string>,
) {
	const properties = getPackageProperties(sourceFile);
	if (!properties) {
		return;
	}

	for (const property of properties) {
		if (
			property.kind === SyntaxKind.PropertyAssignment &&
			property.name.kind === SyntaxKind.StringLiteral &&
			propertyNames.has(property.name.text)
		) {
			yield property.initializer as JsonNode;
		}
	}
}

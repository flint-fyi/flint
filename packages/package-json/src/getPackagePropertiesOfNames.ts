import type { JsonNode } from "@flint.fyi/json-language";
import ts from "typescript";

import { getPackageProperties } from "./getPackageProperties.ts";

export function* getPackagePropertiesOfNames(
	sourceFile: ts.JsonSourceFile,
	propertyNames: Set<string>,
) {
	const properties = getPackageProperties(sourceFile);
	if (!properties) {
		return;
	}

	for (const property of properties) {
		if (
			property.name?.kind === ts.SyntaxKind.StringLiteral &&
			propertyNames.has(property.name.text)
		) {
			yield (property as ts.PropertyAssignment).initializer as JsonNode;
		}
	}
}

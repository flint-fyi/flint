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

	const root = sourceFile.statements[0];
	if (root?.expression.kind !== SyntaxKind.ObjectLiteralExpression) {
		return;
	}

	for (const property of root.expression.properties) {
		if (
			property.kind === SyntaxKind.PropertyAssignment &&
			property.name.kind === SyntaxKind.StringLiteral &&
			propertyNames.has(property.name.text)
		) {
			yield property.initializer as JsonNode;
		}
	}
}

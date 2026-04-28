import type { JsonNode, JsonSourceFile } from "@flint.fyi/json-language";
import { SyntaxKind } from "typescript";

export function* getPackagePropertiesOfNames(
	sourceFile: JsonSourceFile,
	propertyNames: ReadonlySet<string>,
) {
	if (sourceFile.statements.length !== 1) {
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

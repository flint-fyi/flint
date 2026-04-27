import type { JsonFileServices, JsonNode } from "@flint.fyi/json-language";
import ts from "typescript";

export function* getPackagePropertiesOfNames(
	sourceFile: JsonFileServices["sourceFile"],
	propertyNames: ReadonlySet<string>,
) {
	if (sourceFile.statements.length !== 1) {
		return;
	}

	const root = sourceFile.statements[0];
	if (root?.expression.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
		return;
	}

	for (const property of root.expression.properties) {
		if (
			property.kind === ts.SyntaxKind.PropertyAssignment &&
			property.name.kind === ts.SyntaxKind.StringLiteral &&
			propertyNames.has(property.name.text)
		) {
			yield property.initializer as JsonNode;
		}
	}
}

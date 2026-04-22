import type { JsonNode } from "@flint.fyi/json-language";
import ts from "typescript";

export function* getPackagePropertiesOfNames(
	sourceFile: ts.JsonSourceFile,
	propertyNames: Set<string>,
) {
	if (sourceFile.statements.length !== 1) {
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const root = sourceFile.statements[0]!;
	if (root.expression.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
		return;
	}

	for (const property of root.expression.properties) {
		if (
			property.name?.kind === ts.SyntaxKind.StringLiteral &&
			propertyNames.has(property.name.text)
		) {
			yield (property as ts.PropertyAssignment).initializer as JsonNode;
		}
	}
}

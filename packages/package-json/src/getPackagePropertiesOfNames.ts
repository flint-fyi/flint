import type { AST, JsonNode } from "@flint.fyi/json-language";
import ts from "typescript";

export function* getPackagePropertiesOfNames(
	sourceFile: AST.SourceFile,
	propertyNames: Set<string>,
) {
	if (sourceFile.statements.length !== 1) {
		return;
	}

	const root = sourceFile.statements[0];
	if (
		root?.kind !== ts.SyntaxKind.ExpressionStatement ||
		root.expression.kind !== ts.SyntaxKind.ObjectLiteralExpression
	) {
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

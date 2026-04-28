import type { JsonSourceFile } from "@flint.fyi/json-language";
import ts from "typescript";

export function getPackageProperties(sourceFile: JsonSourceFile) {
	if (sourceFile.statements.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const root = sourceFile.statements[0]!;
	if (root.expression.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
		return undefined;
	}

	return root.expression.properties;
}

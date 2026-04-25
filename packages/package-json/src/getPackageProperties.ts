import ts from "typescript";

export function getPackageProperties(sourceFile: ts.JsonSourceFile) {
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

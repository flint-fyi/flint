import ts from "typescript";

import { getPackageProperties } from "./getPackageProperties.ts";

export function getPackagePropertyOfName(
	sourceFile: ts.JsonSourceFile,
	propertyName: string,
) {
	return getPackageProperties(sourceFile)?.find(
		(property) =>
			property.name?.kind === ts.SyntaxKind.StringLiteral &&
			property.name.text === propertyName,
	);
}

import ts from "typescript";

import type { JsonSourceFile } from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";

import { getPackageProperties } from "./getPackageProperties.ts";

export function getPackagePropertyOfName(
	sourceFile: JsonSourceFile,
	propertyName: string,
): AST.ObjectLiteralElementLike | undefined {
	return getPackageProperties(sourceFile)?.find(
		(property) =>
			property.name?.kind === ts.SyntaxKind.StringLiteral &&
			property.name.text === propertyName,
	);
}

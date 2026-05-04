import type { JsonSourceFile } from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { getPackageProperties } from "./getPackageProperties.ts";

export function* getPackagePropertyAssignmentsOfNames(
	sourceFile: JsonSourceFile,
	propertyNames: ReadonlySet<string>,
): Iterable<AST.PropertyAssignment & { readonly name: AST.StringLiteral }> {
	const properties = getPackageProperties(sourceFile);
	if (!properties) {
		return;
	}

	for (const property of properties) {
		if (
			property.kind === SyntaxKind.PropertyAssignment &&
			property.name.kind === SyntaxKind.StringLiteral &&
			propertyNames.has(property.name.text)
		) {
			yield property as AST.PropertyAssignment & {
				readonly name: AST.StringLiteral;
			};
		}
	}
}

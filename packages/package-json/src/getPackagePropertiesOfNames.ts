import type { JsonSourceFile } from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { getPackageProperties } from "./getPackageProperties.ts";

export function getPackagePropertiesOfNames<T extends string[]>(
	sourceFile: JsonSourceFile,
	propertyNames: T,
): Partial<Record<T[number], AST.PropertyAssignment>> {
	const result: Partial<Record<T[number], AST.PropertyAssignment>> = {};

	const properties = getPackageProperties(sourceFile);
	if (!properties) {
		return result;
	}

	const propertyNameSet = new Set(propertyNames);

	const isPropertyName = (name: string): name is T[number] => {
		return propertyNameSet.has(name as T[number]);
	};

	for (const property of properties) {
		if (
			property.kind === SyntaxKind.PropertyAssignment &&
			property.name.kind === SyntaxKind.StringLiteral &&
			isPropertyName(property.name.text)
		) {
			result[property.name.text] = property;
		}
	}
	return result;
}

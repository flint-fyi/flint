import type { DocumentNode, MemberNode } from "@humanwhocodes/momoa";
import { SyntaxKind } from "typescript";

import type { JsonSourceFile } from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";

import {
	getPackageProperties,
	getPackagePropertiesLegacy,
} from "./getPackageProperties.ts";

export function getPackagePropertiesOfNames<T extends string[]>(
	rootNode: DocumentNode,
	propertyNames: T,
): Partial<Record<T[number], MemberNode>> {
	const result: Partial<Record<T[number], MemberNode>> = {};

	const properties = getPackageProperties(rootNode);
	if (!properties) {
		return result;
	}

	const propertyNameSet = new Set(propertyNames);

	const isPropertyName = (name: string): name is T[number] => {
		return propertyNameSet.has(name as T[number]);
	};

	for (const property of properties) {
		if (
			property.name.type === "String" &&
			isPropertyName(property.name.value)
		) {
			result[property.name.value] = property;
		}
	}
	return result;
}

export function getPackagePropertiesOfNamesLegacy<T extends string[]>(
	sourceFile: JsonSourceFile,
	propertyNames: T,
): Partial<Record<T[number], AST.PropertyAssignment>> {
	const result: Partial<Record<T[number], AST.PropertyAssignment>> = {};

	const properties = getPackagePropertiesLegacy(sourceFile);
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

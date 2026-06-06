import type { DocumentNode, MemberNode } from "@humanwhocodes/momoa";
import ts from "typescript";

import type { JsonSourceFile } from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";

import {
	getPackageProperties,
	getPackagePropertiesLegacy,
} from "./getPackageProperties.ts";

export function getPackagePropertyOfName(
	rootNode: DocumentNode,
	propertyName: string,
): MemberNode | undefined {
	return getPackageProperties(rootNode)?.find(
		(property) =>
			property.name.type === "String" && property.name.value === propertyName,
	);
}

export function getPackagePropertyOfNameLegacy(
	sourceFile: JsonSourceFile,
	propertyName: string,
): AST.ObjectLiteralElementLike | undefined {
	return getPackagePropertiesLegacy(sourceFile)?.find(
		(property) =>
			property.name?.kind === ts.SyntaxKind.StringLiteral &&
			property.name.text === propertyName,
	);
}

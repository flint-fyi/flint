import type { DocumentNode, MemberNode } from "@humanwhocodes/momoa";
import ts from "typescript";

import type { JsonSourceFile } from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";

export function getPackageProperties(
	rootNode: DocumentNode,
): MemberNode[] | undefined {
	const root = rootNode.body;
	if (root.type !== "Object") {
		return undefined;
	}

	return root.members;
}

export function getPackagePropertiesLegacy(
	sourceFile: JsonSourceFile,
): ts.NodeArray<AST.ObjectLiteralElementLike> | undefined {
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

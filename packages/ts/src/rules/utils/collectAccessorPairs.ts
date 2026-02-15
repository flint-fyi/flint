import type { AST } from "@flint.fyi/typescript-language";
import ts from "typescript";

export interface AccessorInfo {
	index: number;
	node: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration;
}

export interface AccessorPair {
	getter?: AccessorInfo;
	setter?: AccessorInfo;
}

export function collectAccessorPairs(
	members: ts.NodeArray<AST.AnyNode>,
	sourceFile: AST.SourceFile,
) {
	const pairs = new Map<string, AccessorPair>();

	members.forEach((member, index) => {
		if (
			member.kind !== ts.SyntaxKind.GetAccessor &&
			member.kind !== ts.SyntaxKind.SetAccessor
		) {
			return;
		}

		const name = getPropertyName(member, sourceFile);
		let pair = pairs.get(name);
		if (!pair) {
			pair = {};
			pairs.set(name, pair);
		}

		const entry = { index, node: member };

		if (member.kind === ts.SyntaxKind.GetAccessor) {
			pair.getter = entry;
		} else {
			pair.setter = entry;
		}
	});

	return pairs;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getPropertyName(
	accessor: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration,
	sourceFile: AST.SourceFile,
) {
	if (
		ts.isIdentifier(accessor.name) ||
		ts.isStringLiteral(accessor.name) ||
		ts.isNumericLiteral(accessor.name)
	) {
		return accessor.name.text;
	}

	return accessor.name.getText(sourceFile);
}

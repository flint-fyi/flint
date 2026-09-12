import { SyntaxKind } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export interface AccessorInfo {
	index: number;
	node: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration;
}

export interface AccessorPair {
	getter?: AccessorInfo;
	setter?: AccessorInfo;
}

export function collectAccessorPairs(
	members: readonly AST.AnyNode[],
	sourceFile: AST.SourceFile,
): Map<string, AccessorPair> {
	const pairs = new Map<string, AccessorPair>();

	members.forEach((member, index) => {
		if (
			member.kind !== SyntaxKind.GetAccessor &&
			member.kind !== SyntaxKind.SetAccessor
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

		if (member.kind === SyntaxKind.GetAccessor) {
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
		accessor.name.kind === SyntaxKind.Identifier ||
		accessor.name.kind === SyntaxKind.StringLiteral ||
		accessor.name.kind === SyntaxKind.NumericLiteral
	) {
		return accessor.name.text;
	}

	return accessor.name.getText(sourceFile);
}

import {
	isIdentifier,
	isPropertyAccessExpression,
} from "typescript-native/unstable/ast";
import type { Program } from "typescript-native/unstable/sync";

import {
	isGlobalDeclaration,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
export function isGlobalDocumentReference(
	node: AST.Node,
	typeChecker: Checker,
	program: Program,
): boolean {
	if (isIdentifier(node)) {
		return (
			node.text === "document" &&
			isGlobalDeclaration(node, typeChecker, program)
		);
	}

	return (
		isPropertyAccessExpression(node) &&
		isIdentifier(node.expression) &&
		isIdentifier(node.name) &&
		node.name.text === "document" &&
		isGlobalDeclaration(node.name, typeChecker, program)
	);
}

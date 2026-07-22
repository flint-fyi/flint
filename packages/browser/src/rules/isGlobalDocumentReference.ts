import { SyntaxKind, type Program } from "typescript";

import {
	isGlobalDeclaration,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
export function isGlobalDocumentReference(
	node: AST.Expression,
	typeChecker: Checker,
	program: Program,
) {
	if (node.kind === SyntaxKind.Identifier) {
		return (
			node.text === "document" &&
			isGlobalDeclaration(node, typeChecker, program)
		);
	}

	return (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.kind === SyntaxKind.Identifier &&
		node.name.kind === SyntaxKind.Identifier &&
		node.name.text === "document" &&
		isGlobalDeclaration(node.name, typeChecker, program)
	);
}

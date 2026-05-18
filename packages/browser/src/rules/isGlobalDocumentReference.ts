import {
	type AST,
	type Checker,
	isGlobalDeclaration,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

export function isGlobalDocumentReference(
	node: AST.Expression,
	typeChecker: Checker,
) {
	if (node.kind === SyntaxKind.Identifier) {
		return node.text === "document" && isGlobalDeclaration(node, typeChecker);
	}

	return (
		node.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.kind === SyntaxKind.Identifier &&
		node.expression.text === "window" &&
		node.name.kind === SyntaxKind.Identifier &&
		node.name.text === "document" &&
		isGlobalDeclaration(node.expression, typeChecker) &&
		isGlobalDeclaration(node.name, typeChecker)
	);
}

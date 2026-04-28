import type { Checker } from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import type * as AST from "../types/ast.ts";

/**
 * Gets all references to a variable that modify it (assignments, increments, decrements).
 *
 * TODO: Replace with a proper scope manager when available (see #400).
 * @returns An array of identifier nodes that modify the variable.
 */
export function getModifyingReferences(
	identifier: AST.Identifier,
	sourceFile: AST.SourceFile,
	typeChecker: Checker,
): ts.Identifier[] {
	const symbol = typeChecker.getSymbolAtLocation(identifier);
	if (!symbol?.valueDeclaration) {
		return [];
	}

	const { valueDeclaration } = symbol;
	const modifyingReferences: ts.Identifier[] = [];

	function isIdentifierForSameSymbol(
		node: AST.AnyNode,
	): node is AST.Identifier {
		if (node.kind !== ts.SyntaxKind.Identifier) {
			return false;
		}

		const symbol = typeChecker.getSymbolAtLocation(node);
		if (symbol?.valueDeclaration !== valueDeclaration) {
			return false;
		}

		switch (node.parent.kind) {
			case ts.SyntaxKind.BinaryExpression:
				return (
					tsutils.isAssignmentKind(node.parent.operatorToken.kind) &&
					node.parent.left === node
				);

			case ts.SyntaxKind.PostfixUnaryExpression:
			case ts.SyntaxKind.PrefixUnaryExpression:
				return node.parent.operand === node;

			default:
				return false;
		}
	}

	function visit(node: ts.Node): void {
		// Check if this is an identifier that refers to the same symbol
		if (isIdentifierForSameSymbol(node as AST.AnyNode)) {
			modifyingReferences.push(node as AST.Identifier);
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return modifyingReferences;
}

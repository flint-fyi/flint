import * as tsutils from "ts-api-utils";
import ts from "typescript";

import * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";

/**
 * Gets all references to a variable that modify it (assignments, increments, decrements).
 *
 * TODO: Replace with a proper scope manager when available (see #400).
 * @returns An array of identifier nodes that modify the variable.
 */
export function getModifyingReferences(
	identifier: AST.Identifier,
	sourceFile: AST.SourceFile | ts.SourceFile,
	typeChecker: Checker,
): ts.Identifier[] {
	const symbol = typeChecker.getSymbolAtLocation(identifier);
	if (!symbol?.valueDeclaration) {
		return [];
	}

	const valueDeclaration = symbol.valueDeclaration;
	const modifyingReferences: ts.Identifier[] = [];

	function visit(node: ts.Node): void {
		// Check if this is an identifier that refers to the same symbol
		if (ts.isIdentifier(node)) {
			const nodeSymbol = typeChecker.getSymbolAtLocation(node);
			if (
				nodeSymbol?.valueDeclaration &&
				nodeSymbol.valueDeclaration === valueDeclaration
			) {
				// Check if this identifier is being modified
				const parent = node.parent;

				// Assignment expressions (=, +=, -=, etc.)
				if (
					ts.isBinaryExpression(parent) &&
					tsutils.isAssignmentKind(parent.operatorToken.kind) &&
					parent.left === node
				) {
					modifyingReferences.push(node);
				}
				// Unary expressions (++, --)
				else if (
					(ts.isPostfixUnaryExpression(parent) ||
						ts.isPrefixUnaryExpression(parent)) &&
					parent.operand === node
				) {
					modifyingReferences.push(node);
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return modifyingReferences;
}

import { NodeFlags, SyntaxKind, type Node } from "typescript-native/ast";

import type * as AST from "../types/ast.ts";

/**
 * In JavaScript files, TypeScript reparses JSDoc into nodes that were never
 * written as syntax: `@typedef` and `@import` become statements, `@param`
 * and `@returns` become type annotations, and `@type` and `@satisfies` casts
 * wrap their expression in an `as` or `satisfies` expression.
 * @returns The node as authored: `undefined` for a node that only exists
 * because of JSDoc, and the wrapped expression for a JSDoc cast.
 */
export function getAuthoredNode(node: Node): Node | undefined {
	if (node.flags & NodeFlags.Reparsed) {
		return undefined;
	}

	let authored = node as AST.AnyNode;
	while (
		(authored.kind === SyntaxKind.AsExpression ||
			authored.kind === SyntaxKind.SatisfiesExpression) &&
		authored.type.flags & NodeFlags.Reparsed
	) {
		authored = authored.expression;
	}
	return authored;
}

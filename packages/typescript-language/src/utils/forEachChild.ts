import { NodeFlags } from "typescript-native/ast";

import type * as AST from "../types/ast.ts";
import { getAuthoredNode } from "./getAuthoredNode.ts";

/**
 * `node.forEachChild`, without the nodes TypeScript reparses from JSDoc in
 * JavaScript files.
 */
export function forEachChild<Result>(
	node: AST.AnyNode,
	visitor: (node: AST.AnyNode) => Result | undefined,
): Result | undefined {
	if (!(node.flags & NodeFlags.JavaScriptFile)) {
		return node.forEachChild(visitor);
	}

	return node.forEachChild((child) => {
		const authored = getAuthoredNode(child);
		return authored && visitor(authored as AST.AnyNode);
	});
}

import type { AST } from "@flint.fyi/typescript-language";
import ts from "typescript";

/**
 * Invokes a callback for each child of the given node. The 'cbNode' callback is invoked for all child nodes
 * stored in properties. If a 'cbNodes' callback is specified, it is invoked for embedded arrays; otherwise,
 * embedded arrays are flattened and the 'cbNode' callback is invoked for each element. If a callback returns
 * a truthy value, iteration stops and that value is returned. Otherwise, undefined is returned.
 * @param node a given node to visit its children
 * @param cbNode a callback to be invoked for all child nodes
 * @param cbNodes a callback to be invoked for embedded array
 * @remarks `forEachChild` must visit the children of a node in the order
 * that they appear in the source code. The language service depends on this property to locate nodes by position.
 */
export const forEachChild = ts.forEachChild as unknown as <T>(
	node: AST.AnyNode,
	cbNode: (node: AST.AnyNode) => T | undefined,
	cbNodes?: (nodes: ts.NodeArray<AST.AnyNode>) => T | undefined,
) => T | undefined;

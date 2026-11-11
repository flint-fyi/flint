import { NodeFlags, type Node, type NodeArray } from "../native/ast.ts";
import type * as AST from "../types/ast.ts";
import { getAuthoredNode } from "./getAuthoredNode.ts";

/**
 * `node.forEachChild`, without the nodes TypeScript reparses from JSDoc in
 * JavaScript files.
 */
export function forEachChild<T>(
	node: AST.AnyNode,
	cbNode: (node: AST.AnyNode) => T | undefined,
	cbNodes?: (nodes: readonly AST.AnyNode[]) => T | undefined,
): T | undefined {
	if (!(node.flags & NodeFlags.JavaScriptFile)) {
		return node.forEachChild(
			(child: Node) => cbNode(child as AST.AnyNode),
			cbNodes
				? (children: NodeArray<Node>) =>
						cbNodes(children as readonly AST.AnyNode[])
				: undefined,
		);
	}

	const visitAuthored = (child: Node): T | undefined => {
		const authored = getAuthoredNode(child);
		return authored && cbNode(authored as AST.AnyNode);
	};

	return node.forEachChild(
		visitAuthored,
		cbNodes
			? (children: NodeArray<Node>) => {
					const authored: AST.AnyNode[] = [];
					for (const child of children) {
						const authoredChild = getAuthoredNode(child);
						if (authoredChild) {
							authored.push(authoredChild as AST.AnyNode);
						}
					}
					return cbNodes(authored);
				}
			: undefined,
	);
}

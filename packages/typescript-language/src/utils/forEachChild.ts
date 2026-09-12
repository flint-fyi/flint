import type { Node, NodeArray } from "typescript-native/unstable/ast";

import type * as AST from "../types/ast.ts";

export const forEachChild = <T>(
	node: AST.AnyNode,
	cbNode: (node: AST.AnyNode) => T | undefined,
	cbNodes?: (nodes: readonly AST.AnyNode[]) => T | undefined,
): T | undefined =>
	node.forEachChild(
		(child: Node) => cbNode(child as AST.AnyNode),
		cbNodes
			? (children: NodeArray<Node>) =>
					cbNodes(children as readonly AST.AnyNode[])
			: undefined,
	);

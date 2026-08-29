import { SyntaxKind, type Node } from "typescript";

import {
	groupFileVisitors,
	runFileVisitorSubscriptions,
	type FileVisitors,
	type FileVisitorSubscription,
} from "@flint.fyi/core";

import type { TypeScriptFileServices } from "./language.ts";
import { NodeSyntaxKinds } from "./nodeSyntaxKinds.ts";

export type NodeVisitorSubscriptions = FileVisitorSubscription<
	Node,
	TypeScriptFileServices
>[];

/**
 * All rules' visitors for a file, indexed by numeric {@link SyntaxKind}.
 */
export interface NodeVisitorDispatch {
	enter: (NodeVisitorSubscriptions | undefined)[] | undefined;
	exit: (NodeVisitorSubscriptions | undefined)[] | undefined;

	visit: (node: Node) => void;
}

export function createNodeVisitorDispatch(
	fileVisitors: readonly FileVisitors<object, TypeScriptFileServices>[],
): NodeVisitorDispatch | undefined {
	const grouped = groupFileVisitors<Node, TypeScriptFileServices>(fileVisitors);
	const enter = grouped.enter && createSubscriptionsByKind(grouped.enter);
	const exit = grouped.exit && createSubscriptionsByKind(grouped.exit);

	if (enter) {
		const visit = exit
			? (node: Node) => {
					const entering = enter[node.kind];
					if (entering !== undefined) {
						runFileVisitorSubscriptions(entering, node);
					}

					node.forEachChild(visit);

					const exiting = exit[node.kind];
					if (exiting !== undefined) {
						runFileVisitorSubscriptions(exiting, node);
					}
				}
			: (node: Node) => {
					const entering = enter[node.kind];
					if (entering !== undefined) {
						runFileVisitorSubscriptions(entering, node);
					}

					node.forEachChild(visit);
				};

		return { enter, exit, visit };
	}

	if (exit) {
		const visit = (node: Node) => {
			node.forEachChild(visit);

			const exiting = exit[node.kind];
			if (exiting !== undefined) {
				runFileVisitorSubscriptions(exiting, node);
			}
		};

		return { enter, exit, visit };
	}

	return undefined;
}

function createSubscriptionsByKind(
	group: Map<string, NodeVisitorSubscriptions>,
) {
	const byKind: (NodeVisitorSubscriptions | undefined)[] = new Array<undefined>(
		SyntaxKind.Count + 1,
	).fill(undefined);

	for (const [name, subscriptions] of group) {
		const kind = NodeSyntaxKinds[name as keyof typeof SyntaxKind] as
			| number
			| undefined;

		// Names that alias an earlier kind never matched a visited node's kind
		if (kind === undefined || NodeSyntaxKinds[kind] !== name) {
			continue;
		}

		byKind[kind] = subscriptions;
	}

	return byKind;
}

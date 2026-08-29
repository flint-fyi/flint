import type { Node, SyntaxKind } from "typescript";

import {
	groupFileVisitors,
	runFileVisitorSubscriptions,
	type FileVisitors,
	type FileVisitorSubscription,
} from "@flint.fyi/core";

import type { TypeScriptFileServices } from "./language.ts";
import { NodeSyntaxKinds } from "./nodeSyntaxKinds.ts";

/**
 * All visitor subscriptions for a file, along with the callback to run on them.
 */
export interface NodeVisitorsForFile {
	enter: NodeVisitorSubscriptionsByKind | undefined;
	exit: NodeVisitorSubscriptionsByKind | undefined;
	visit: (node: Node) => void;
}

/**
 * For each node, the visitor subscriptions that will run when that node is visited.
 */
export type NodeVisitorSubscriptions = FileVisitorSubscription<
	Node,
	TypeScriptFileServices
>[];

/**
 * For each node kind that has visitors registered, its associated subscriptions.
 */
type NodeVisitorSubscriptionsByKind = Partial<
	Record<SyntaxKind, NodeVisitorSubscriptions>
>;

export function createNodeVisitorsForFile(
	fileVisitors: readonly FileVisitors<object, TypeScriptFileServices>[],
): NodeVisitorsForFile | undefined {
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
): NodeVisitorSubscriptionsByKind {
	const byKind = Object.create(null) as NodeVisitorSubscriptionsByKind;

	for (const [name, subscriptions] of group) {
		const kind = NodeSyntaxKinds[name as keyof typeof SyntaxKind];

		if (kind === undefined || NodeSyntaxKinds[kind] !== name) {
			continue;
		}

		byKind[kind] = subscriptions;
	}

	return byKind;
}

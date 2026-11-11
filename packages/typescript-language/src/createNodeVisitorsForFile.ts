import {
	groupFileVisitors,
	runFileVisitorSubscriptions,
	type FileVisitors,
	type FileVisitorSubscription,
} from "@flint.fyi/core";

import { NodeFlags, type Node, type SyntaxKind } from "./native/ast.ts";
import { NodeSyntaxKinds } from "./nodeSyntaxKinds.ts";
import type { TypeScriptFileServices } from "./types/services.ts";
import { getAuthoredNode } from "./utils/getAuthoredNode.ts";

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

/**
 * Given all rule visitors for a file, collects them into a single {@link NodeVisitorsForFile}.
 */
export function createNodeVisitorsForFile(
	fileVisitors: readonly FileVisitors<object, TypeScriptFileServices>[],
): NodeVisitorsForFile | undefined {
	const grouped = groupFileVisitors<Node, TypeScriptFileServices>(fileVisitors);
	const enter = grouped.enter && createSubscriptionsByKind(grouped.enter);
	const exit = grouped.exit && createSubscriptionsByKind(grouped.exit);

	if (!enter && !exit) {
		return undefined;
	}

	const visitTypeScript = createVisit(enter, exit);

	const visitJavaScript = (node: Node): void => {
		const entering = enter?.[node.kind];
		if (entering !== undefined) {
			runFileVisitorSubscriptions(entering, node);
		}

		node.forEachChild(visitJavaScriptChild);

		const exiting = exit?.[node.kind];
		if (exiting !== undefined) {
			runFileVisitorSubscriptions(exiting, node);
		}
	};

	const visitJavaScriptChild = (child: Node): void => {
		const authored = getAuthoredNode(child);
		if (authored) {
			visitJavaScript(authored);
		}
	};

	return {
		enter,
		exit,
		// Only JavaScript files contain nodes reparsed from JSDoc, so every
		// other file skips checking each node for them.
		visit: (node) => {
			if (node.flags & NodeFlags.JavaScriptFile) {
				visitJavaScript(node);
			} else {
				visitTypeScript(node);
			}
		},
	};
}

function createSubscriptionsByKind(
	group: Map<string, NodeVisitorSubscriptions>,
): NodeVisitorSubscriptionsByKind {
	const byKind = Object.create(null) as NodeVisitorSubscriptionsByKind;

	for (const [name, subscriptions] of group) {
		const kind = NodeSyntaxKinds[name as keyof typeof NodeSyntaxKinds];

		if (typeof kind === "number" && NodeSyntaxKinds[kind] === name) {
			byKind[kind] = subscriptions;
		}
	}

	return byKind;
}

function createVisit(
	enter: NodeVisitorSubscriptionsByKind | undefined,
	exit: NodeVisitorSubscriptionsByKind | undefined,
): (node: Node) => void {
	if (!enter) {
		const visit = (node: Node): void => {
			node.forEachChild(visit);

			const exiting = exit?.[node.kind];
			if (exiting !== undefined) {
				runFileVisitorSubscriptions(exiting, node);
			}
		};

		return visit;
	}

	const visit = exit
		? (node: Node): void => {
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
		: (node: Node): void => {
				const entering = enter[node.kind];
				if (entering !== undefined) {
					runFileVisitorSubscriptions(entering, node);
				}

				node.forEachChild(visit);
			};

	return visit;
}

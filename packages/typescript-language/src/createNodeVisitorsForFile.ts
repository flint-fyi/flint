import type { Node, SyntaxKind } from "typescript";

import {
	groupFileVisitors,
	type FileVisitors,
	type FileVisitorSubscription,
	type RuleVisitor,
	type SubscriptionsByName,
} from "@flint.fyi/core";

import type { TypeScriptNodesByName, TypeScriptNodeVisitors } from "./nodes.ts";
import { NodeSyntaxKinds } from "./nodeSyntaxKinds.ts";
import type { TypeScriptFileServices } from "./types/services.ts";

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
	never,
	TypeScriptFileServices
>[];

/**
 * Each entry's `kind` must be the SyntaxKind of the same name.
 */
type NodesKeyedByKind<NodesByName> = {
	[Name in keyof NodesByName]: Name extends keyof typeof SyntaxKind
		? { kind: (typeof SyntaxKind)[Name] }
		: never;
};

/**
 * Fails to compile if a node map has an entry whose `kind` doesn't match its name.
 */
type CheckedNodesByKind<NodesByName extends NodesKeyedByKind<NodesByName>> =
	NodesByName;

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
	fileVisitors: readonly FileVisitors<
		TypeScriptNodeVisitors,
		TypeScriptFileServices
	>[],
): NodeVisitorsForFile | undefined {
	const grouped = groupFileVisitors<
		CheckedNodesByKind<TypeScriptNodesByName>,
		TypeScriptFileServices
	>(fileVisitors);
	const enter = grouped.enter && createSubscriptionsByKind(grouped.enter);
	const exit = grouped.exit && createSubscriptionsByKind(grouped.exit);

	if (enter) {
		const visit = exit
			? (node: Node) => {
					const entering = enter[node.kind];
					if (entering !== undefined) {
						runNodeVisitorSubscriptions(entering, node);
					}

					node.forEachChild(visit);

					const exiting = exit[node.kind];
					if (exiting !== undefined) {
						runNodeVisitorSubscriptions(exiting, node);
					}
				}
			: (node: Node) => {
					const entering = enter[node.kind];
					if (entering !== undefined) {
						runNodeVisitorSubscriptions(entering, node);
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
				runNodeVisitorSubscriptions(exiting, node);
			}
		};

		return { enter, exit, visit };
	}

	return undefined;
}

/**
 * Runs subscriptions that were registered under `node.kind`'s name.
 */
export function runNodeVisitorSubscriptions(
	subscriptions: NodeVisitorSubscriptions,
	node: Node,
): void {
	// Subscriptions are looked up by node.kind, and CheckedNodesByKind ensures each name's AST type has that kind,
	// but typescript's Node isn't a union that TypeScript can narrow by kind.
	for (const { services, visitor } of subscriptions) {
		(visitor as RuleVisitor<Node, TypeScriptFileServices>)(node, services);
	}
}

function createSubscriptionsByKind(
	group: SubscriptionsByName<TypeScriptNodesByName, TypeScriptFileServices>,
): NodeVisitorSubscriptionsByKind {
	const byKind = Object.create(null) as NodeVisitorSubscriptionsByKind;

	for (const [name, subscriptions] of group.subscriptions) {
		// Names come from visitor keys typed as TypeScriptNodesByName keys, with any :exit suffix removed.
		byKind[NodeSyntaxKinds[name as keyof TypeScriptNodesByName]] =
			subscriptions;
	}

	return byKind;
}

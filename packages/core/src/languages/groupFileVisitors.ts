import { WeakCachedFactory } from "cached-factory";

import type { FileVisitors } from "../types/languages.ts";
import type { RuleVisitor } from "../types/rules.ts";
import type { WithExitKeys } from "../types/visitors.ts";

/**
 * One rule's visitor for a node kind, along with the services it'll be given.
 */
export interface FileVisitorSubscription<Node, Services extends object> {
	services: Services;
	visitor: RuleVisitor<Node, Services>;
}

/**
 * All rules' visitors for a file, grouped by node kind for a single AST walk.
 */
export interface GroupedFileVisitors<NodesByName, Services extends object> {
	enter: SubscriptionsByName<NodesByName, Services> | undefined;
	exit: SubscriptionsByName<NodesByName, Services> | undefined;
}

/**
 * A map of node names to nodes, where each node's `type` is its name.
 */
export type NodesKeyedByType<NodesByName> = {
	[Name in keyof NodesByName]: { type: Name };
};

/**
 * Subscriptions grouped by node name.
 * Read them with {@link runFileVisitorSubscriptions}, which looks them up by `node.type`.
 */
export interface SubscriptionsByName<NodesByName, Services extends object> {
	readonly nodesByName?: NodesByName;
	readonly subscriptions: Map<
		string,
		FileVisitorSubscription<never, Services>[]
	>;
}

interface VisitorEntry {
	name: string;
	phase: VisitorPhase;
	visitor: RuleVisitor<never, never>;
}

type VisitorPhase = "enter" | "exit";

const exitSuffix = ":exit";

const visitorEntries = new WeakCachedFactory<object, readonly VisitorEntry[]>(
	(visitors) => {
		const entries: VisitorEntry[] = [];

		// Each visitor's node type depends on its key, which only runFileVisitorSubscriptions recovers.
		for (const [key, visitor] of Object.entries(
			visitors as Record<string, RuleVisitor<never, never> | undefined>,
		)) {
			if (visitor) {
				entries.push({
					...(key.endsWith(exitSuffix)
						? { name: key.slice(0, -exitSuffix.length), phase: "exit" }
						: { name: key, phase: "enter" }),
					visitor,
				});
			}
		}

		return entries;
	},
);

export function groupFileVisitors<NodesByName, Services extends object>(
	fileVisitors: readonly FileVisitors<WithExitKeys<NodesByName>, Services>[],
): GroupedFileVisitors<NodesByName, Services> {
	const enter = new Map<string, FileVisitorSubscription<never, Services>[]>();
	const exit = new Map<string, FileVisitorSubscription<never, Services>[]>();

	for (const { services, visitors } of fileVisitors) {
		for (const entry of visitorEntries.get(visitors)) {
			const group = entry.phase === "enter" ? enter : exit;
			const subscription = {
				services,
				// visitorEntries is cached per visitors object, so it can't carry the Services these visitors were typed with.
				visitor: entry.visitor as RuleVisitor<never, Services>,
			};
			const subscriptions = group.get(entry.name);

			if (subscriptions) {
				subscriptions.push(subscription);
			} else {
				group.set(entry.name, [subscription]);
			}
		}
	}

	return {
		enter: enter.size ? { subscriptions: enter } : undefined,
		exit: exit.size ? { subscriptions: exit } : undefined,
	};
}

export function runFileVisitorSubscriptions<
	NodesByName extends NodesKeyedByType<NodesByName>,
	Services extends object,
>(
	subscriptionsByName: SubscriptionsByName<NodesByName, Services>,
	node: NodesByName[keyof NodesByName],
): void {
	// keyof NodesByName may include numbers and symbols, but node types are always strings.
	const subscriptions = subscriptionsByName.subscriptions.get(
		node.type as string,
	);
	if (!subscriptions) {
		return;
	}

	// Subscriptions under node.type were registered for NodesByName[node.type],
	// and NodesKeyedByType makes that the only node type with this type key.
	for (const { services, visitor } of subscriptions as FileVisitorSubscription<
		typeof node,
		Services
	>[]) {
		visitor(node, services);
	}
}

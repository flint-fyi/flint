import { WeakCachedFactory } from "cached-factory";

import type { FileVisitors } from "../types/languages.ts";
import type { RuleVisitor } from "../types/rules.ts";

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
export interface GroupedFileVisitors<Node, Services extends object> {
	enter: Map<string, FileVisitorSubscription<Node, Services>[]>;
	exit: Map<string, FileVisitorSubscription<Node, Services>[]> | undefined;
}

type UnknownVisitor = RuleVisitor<never, never>;

interface VisitorEntry {
	isExit: boolean;
	name: string;
	visitor: UnknownVisitor;
}

const exitSuffix = ":exit";

const visitorEntries = new WeakCachedFactory<object, readonly VisitorEntry[]>(
	(visitors) => {
		const entries: VisitorEntry[] = [];

		for (const [key, visitor] of Object.entries(
			visitors as Record<string, undefined | UnknownVisitor>,
		)) {
			if (visitor === undefined) {
				continue;
			}

			const isExit = key.endsWith(exitSuffix);

			entries.push({
				isExit,
				name: isExit ? key.slice(0, -exitSuffix.length) : key,
				visitor,
			});
		}

		return entries;
	},
);

export function groupFileVisitors<Node, Services extends object>(
	fileVisitors: readonly FileVisitors<object, Services>[],
): GroupedFileVisitors<Node, Services> {
	const enter = new Map<string, FileVisitorSubscription<Node, Services>[]>();
	const exit = new Map<string, FileVisitorSubscription<Node, Services>[]>();

	for (const { services, visitors } of fileVisitors) {
		for (const entry of visitorEntries.get(visitors)) {
			const group = entry.isExit ? exit : enter;
			const subscription = {
				services,
				visitor: entry.visitor as RuleVisitor<Node, Services>,
			};
			const subscriptions = group.get(entry.name);

			if (subscriptions) {
				subscriptions.push(subscription);
			} else {
				group.set(entry.name, [subscription]);
			}
		}
	}

	return { enter, exit: exit.size ? exit : undefined };
}

export function runFileVisitorSubscriptions<Node, Services extends object>(
	subscriptions: readonly FileVisitorSubscription<Node, Services>[],
	node: Node,
): void {
	for (const { services, visitor } of subscriptions) {
		visitor(node, services);
	}
}

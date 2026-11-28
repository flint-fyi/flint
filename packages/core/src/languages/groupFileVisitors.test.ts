/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, vi } from "vitest";

import { groupFileVisitors } from "./groupFileVisitors.ts";

describe(groupFileVisitors, () => {
	it("produces enter without exit groups when only enter visitors are provided", () => {
		const services = {};
		const visitor = vi.fn();

		const grouped = groupFileVisitors<{ Node: string }, object>([
			(use) => use(services, { Node: visitor }),
		]);

		grouped.enter!.subscriptions.get("Node")![0]!("node" as never);

		expect(visitor).toHaveBeenCalledExactlyOnceWith("node", services);
		expect(grouped.exit).toBeUndefined();
	});

	it("groups subscriptions when multiple rules visit the same node", () => {
		const firstServices = { name: "first" };
		const firstVisitor = vi.fn();
		const secondServices = { name: "second" };
		const secondVisitor = vi.fn();

		const grouped = groupFileVisitors<{ Node: string }, object>([
			(use) => use(firstServices, { Node: firstVisitor }),
			(use) => use(secondServices, { Node: secondVisitor }),
		]);

		const subscriptions = grouped.enter!.subscriptions.get("Node")!;
		for (const subscription of subscriptions) {
			subscription("node" as never);
		}

		expect(subscriptions).toHaveLength(2);
		expect(firstVisitor).toHaveBeenCalledExactlyOnceWith("node", firstServices);
		expect(secondVisitor).toHaveBeenCalledExactlyOnceWith(
			"node",
			secondServices,
		);
	});

	it("omits groups when visitors are undefined", () => {
		const grouped = groupFileVisitors<{ Node: unknown }, object>([
			(use) =>
				use(
					{},
					// @ts-expect-error -- Projects without exactOptionalPropertyTypes may provide undefined visitors.
					{ Node: undefined },
				),
		]);

		expect(grouped).toEqual({ enter: undefined, exit: undefined });
	});

	it("produces exit without enter groups when only exit visitors are provided", () => {
		const services = {};
		const visitor = vi.fn();

		const grouped = groupFileVisitors<{ Node: string }, object>([
			(use) => use(services, { "Node:exit": visitor }),
		]);

		grouped.exit!.subscriptions.get("Node")![0]!("node" as never);

		expect(grouped.enter).toBeUndefined();
		expect(visitor).toHaveBeenCalledExactlyOnceWith("node", services);
	});

	it("produces both enter and exit groups when both visitors are provided", () => {
		const onEnter = vi.fn();
		const onExit = vi.fn();

		const grouped = groupFileVisitors<{ Node: string }, object>([
			(use) =>
				use(
					{},
					{
						Node: onEnter,
						"Node:exit": onExit,
					},
				),
		]);

		grouped.enter!.subscriptions.get("Node")![0]!("node" as never);

		expect(onEnter).toHaveBeenCalledOnce();
		expect(onExit).not.toHaveBeenCalled();

		grouped.exit!.subscriptions.get("Node")![0]!("node" as never);

		expect(onExit).toHaveBeenCalledOnce();
	});
});

import { describe, expect, it, vi } from "vitest";

import { groupFileVisitors } from "./groupFileVisitors.ts";

describe(groupFileVisitors, () => {
	it("produces enter without exit groups when only enter visitors are provided", () => {
		const visitor = vi.fn();

		const grouped = groupFileVisitors([
			{
				services: {},
				visitors: { Node: visitor },
			},
		]);

		expect(grouped.enter!.get("Node")![0]!.visitor).toBe(visitor);
		expect(grouped.exit).toBeUndefined();
	});

	it("produces exit without enter groups when only exit visitors are provided", () => {
		const visitor = vi.fn();

		const grouped = groupFileVisitors([
			{
				services: {},
				visitors: { "Node:exit": visitor },
			},
		]);

		expect(grouped.enter).toBeUndefined();
		expect(grouped.exit!.get("Node")![0]!.visitor).toBe(visitor);
	});

	it("produces both exit without enter groups when both visitors are provided", () => {
		const onEnter = vi.fn();
		const onExit = vi.fn();

		const grouped = groupFileVisitors([
			{
				services: {},
				visitors: {
					Node: onEnter,
					"Node:exit": onExit,
				},
			},
		]);

		expect(grouped.enter!.get("Node")![0]!.visitor).toBe(onEnter);
		expect(grouped.exit!.get("Node")![0]!.visitor).toBe(onExit);
	});
});

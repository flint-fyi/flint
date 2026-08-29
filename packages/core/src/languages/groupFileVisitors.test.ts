import { expect, it, vi } from "vitest";

import { groupFileVisitors } from "./groupFileVisitors.ts";

it("omits enter groups when no enter visitors are provided", () => {
	const visitor = vi.fn();

	const grouped = groupFileVisitors([
		{
			services: {},
			visitors: { "Node:exit": visitor },
		},
	]);

	expect(grouped.enter).toBeUndefined();
	expect(grouped.exit?.get("Node")?.[0]?.visitor).toBe(visitor);
});

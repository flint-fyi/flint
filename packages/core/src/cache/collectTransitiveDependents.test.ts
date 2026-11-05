import { describe, expect, it } from "vitest";

import { collectTransitiveDependents } from "./collectTransitiveDependents.ts";

function collect(
	seeds: string[],
	dependentsByDependency: Record<string, string[]>,
) {
	return collectTransitiveDependents(
		seeds,
		(dependencyKey) => dependentsByDependency[dependencyKey],
		(filePath) => filePath,
	);
}

describe(collectTransitiveDependents, () => {
	it("walks multi-hop chains without returning the seeds", () => {
		expect(collect(["c"], { b: ["a"], c: ["b"] })).toEqual(new Set(["a", "b"]));
	});

	it("terminates on dependency cycles", () => {
		expect(collect(["a"], { a: ["c"], b: ["a"], c: ["b"] })).toEqual(
			new Set(["b", "c"]),
		);
	});

	it("dedupes dependents by path key", () => {
		expect(
			collectTransitiveDependents(
				["a"],
				(dependencyKey) => (dependencyKey === "a" ? ["B", "b"] : undefined),
				(filePath) => filePath.toLowerCase(),
			),
		).toEqual(new Set(["B"]));
	});
});

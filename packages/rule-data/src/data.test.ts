import { describe, expect, it } from "vitest";

import { getFlintRuleId, ruleData } from "./index.ts";
import { ruleCoverageSources } from "./test-utils/coverage.ts";

describe("data.json", () => {
	it("should not include any duplicate Flint rules", () => {
		const seenIds = new Set<string>();
		const duplicates: string[] = [];

		for (const ruleDetails of ruleData) {
			const id = getFlintRuleId(
				ruleDetails.flint.plugin,
				ruleDetails.flint.name,
			);

			if (seenIds.has(id)) {
				duplicates.push(id);
			} else {
				seenIds.add(id);
			}

			expect(duplicates).toEqual([]);
		}
	});

	it.each(ruleCoverageSources)(
		"includes all $linter rules",
		async ({ collect }) => {
			expect(await collect()).toEqual({
				duplicates: [],
				missing: [],
				stale: [],
			});
		},
	);
});

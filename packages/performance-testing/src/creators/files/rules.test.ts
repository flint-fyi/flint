import { describe, expect, it } from "vitest";

import { comparedRules, ruleCounts } from "./rules.ts";

describe("comparedRules", () => {
	it("contains the same linter intersection for common and many", () => {
		expect(ruleCounts).toEqual({
			1: 1,
			common: 51,
			many: 130,
		});

		for (const compared of comparedRules.many) {
			expect(compared.biome.length).toBeGreaterThan(0);
			expect(compared.eslint).not.toHaveLength(0);
			expect(compared.flint).not.toHaveLength(0);
			expect(compared.oxlint).not.toHaveLength(0);
		}
	});
});

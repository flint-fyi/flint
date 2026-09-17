import { describe, expect, it } from "vitest";

import { comparedRules, ruleCounts } from "./rules.ts";

describe("comparedRules", () => {
	it("narrows each rule set to rules every compared linter implements", () => {
		expect(ruleCounts).toEqual({
			1: 1,
			common: 79,
			many: 204,
		});

		for (const compared of comparedRules.many) {
			expect(compared.eslint).not.toHaveLength(0);
			expect(compared.flint).not.toHaveLength(0);
			expect(compared.oxlint).not.toHaveLength(0);
		}
	});
});

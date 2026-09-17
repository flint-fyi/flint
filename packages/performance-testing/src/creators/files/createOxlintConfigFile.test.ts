import { describe, expect, it } from "vitest";

import { createOxlintConfigFile } from "./createOxlintConfigFile.ts";
import { comparedRules } from "./rules.ts";

describe(createOxlintConfigFile, () => {
	it("enables only the single typed rule when given the 1 rules count", () => {
		expect(createOxlintConfigFile(1)).toMatchObject({
			options: {
				typeAware: true,
			},
			plugins: ["typescript"],
			rules: {
				"typescript/no-for-in-array": "error",
			},
		});
	});

	it("enables every compared rule when given the many rules preset", () => {
		const actual = createOxlintConfigFile("many") as {
			rules: Record<string, string>;
		};

		expect(
			comparedRules.many.every(
				({ oxlint }) => actual.rules[oxlint] === "error",
			),
		).toBe(true);
	});
});

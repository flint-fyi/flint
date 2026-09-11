import { describe, expect, it } from "vitest";

import { createBiomeConfigFile } from "./createBiomeConfigFile.ts";
import { comparedRules } from "./rules.ts";

describe(createBiomeConfigFile, () => {
	it("enables only the single rule when given the 1 rules count", () => {
		expect(createBiomeConfigFile(1)).toEqual({
			linter: {
				includes: ["src/**/*.ts"],
				rules: {
					preset: "none",
					suspicious: {
						noForIn: "error",
					},
				},
			},
		});
	});

	it("enables every compared rule when given the many rules preset", () => {
		const actual = JSON.stringify(createBiomeConfigFile("many"));

		expect(
			comparedRules.many
				.flatMap(({ biome }) => biome)
				.every((name) => actual.includes(`"${name}":"error"`)),
		).toBe(true);
	});
});

import { describe, expect, it } from "vitest";

import { createFlintConfigFile } from "./createFlintConfigFile.ts";
import { comparedRules } from "./rules.ts";

describe(createFlintConfigFile, () => {
	it("enables the single rule when given the 1 rules count", () => {
		const actual = createFlintConfigFile(1);

		expect(actual).toMatchInlineSnapshot(`
			"
			import { defineConfig, ts } from "flint";

			export default defineConfig({
				ignore: ["node_modules", "*.config.*"],
				use: [
					{
						files: ["src/**/*.ts"],
						rules: [
							ts.rules({
								forInArrays: true
							}),
						],
					},
				],
			});
			"
		`);
	});

	it("enables every compared rule when given the many rules preset", () => {
		const actual = createFlintConfigFile("many");

		expect(
			comparedRules.many.every(({ flint }) =>
				actual.includes(`${flint}: true`),
			),
		).toBe(true);
	});
});

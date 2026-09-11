import { describe, expect, it } from "vitest";

import { createRslintConfigFile } from "./createRslintConfigFile.ts";
import { comparedRules } from "./rules.ts";

describe(createRslintConfigFile, () => {
	it("enables only the single typed rule when given the 1 rules count", () => {
		expect(createRslintConfigFile(1)).toMatchInlineSnapshot(`
			"
			import { defineConfig } from "@rslint/core";

			export default defineConfig([
				{
					files: ["src/**/*.ts"],
					languageOptions: {
						parserOptions: {
							projectService: true,
						},
					},
					plugins: ["@typescript-eslint"],
					rules: {
						"@typescript-eslint/no-for-in-array": "error"
					},
				},
			]);
			"
		`);
	});

	it("enables every compared rule when given the many rules preset", () => {
		const actual = createRslintConfigFile("many");

		expect(
			comparedRules.many.every(({ rslint }) =>
				actual.includes(`"${rslint}": "error"`),
			),
		).toBe(true);
	});
});

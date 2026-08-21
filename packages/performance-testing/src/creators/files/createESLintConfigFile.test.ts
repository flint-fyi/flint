import { describe, expect, it } from "vitest";

import { createESLintConfigFile } from "./createESLintConfigFile.ts";
import { comparedRules } from "./rules.ts";

describe("createESLintConfigFile", () => {
	it("imports no plugin packages when the only rule is preregistered", () => {
		const actual = createESLintConfigFile(1);

		expect(actual).toMatchInlineSnapshot(`
			"
			import { defineConfig, globalIgnores } from "eslint/config";

			import tseslint from "typescript-eslint";

			export default defineConfig(
				globalIgnores(["node_modules", "*.config.*"]),
				tseslint.configs.base,
				{
					files: ["src/**/*.ts"],
					languageOptions: {
						parserOptions: {
							projectService: true,
						},
					},
					plugins: {
						
					},
					rules: {
						"@typescript-eslint/no-for-in-array": "error"
					},
				},
			);
			"
		`);
	});

	it("imports each plugin package once when given the many rules preset", () => {
		const actual = createESLintConfigFile("many");

		expect(Array.from(actual.matchAll(/^import unicorn from/gm))).toHaveLength(
			1,
		);
	});

	it("enables every compared rule when given the many rules preset", () => {
		const actual = createESLintConfigFile("many");

		expect(
			comparedRules.many.every(({ eslint }) =>
				actual.includes(`"${eslint}": "error"`),
			),
		).toBe(true);
	});
});

import type { TestCaseRules } from "../../testCases.ts";
import { comparedRules } from "./rules.ts";

export function createRslintConfigFile(rules: TestCaseRules): string {
	const enabled = comparedRules[rules].map(({ rslint }) => rslint);
	const plugins = Array.from(
		new Set(
			enabled
				.filter((name) => name.includes("/"))
				.map((name) => name.slice(0, name.indexOf("/"))),
		),
	).sort();

	return `
import { defineConfig } from "@rslint/core";

export default defineConfig([
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		plugins: [${plugins.map((plugin) => `"${plugin}"`).join(", ")}],
		rules: {
			${enabled.map((name) => `"${name}": "error"`).join(",\n")}
		},
	},
]);
`;
}

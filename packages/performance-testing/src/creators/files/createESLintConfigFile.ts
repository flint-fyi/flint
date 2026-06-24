import type { TestCaseRules } from "../../testCases.ts";
import { commonComparisons, manyComparisons } from "./rules.ts";

const pluginData = new Map([
	[
		"import",
		{
			alias: "importPlugin",
			importer: `import importPlugin from "eslint-plugin-import";`,
			name: "import",
		},
	],
	[
		"regexp",
		{
			importer: `import regexp from "eslint-plugin-regexp";`,
			name: "regexp",
		},
	],
	[
		"unicorn",
		{
			importer: `import unicorn from "eslint-plugin-unicorn";`,
			name: "unicorn",
		},
	],
]);

const ruleValues = {
	1: [
		{
			config: `"@typescript-eslint/no-for-in-array": "error",`,
			plugin: undefined,
		},
	],
	common: commonComparisons
		.sort((a, b) => a.eslint.name.localeCompare(b.eslint.name))
		.map((comparison) => ({
			config: `"${comparison.eslint?.name}": "error"`,
			plugin: comparison.eslint.name.slice(
				0,
				comparison.eslint.name.indexOf("/"),
			),
		})),
	many: manyComparisons
		.sort((a, b) => a.eslint.name.localeCompare(b.eslint.name))
		.map((comparison) => ({
			config: `"${comparison.eslint?.name}": "error"`,
			plugin: comparison.eslint.name.slice(
				0,
				comparison.eslint.name.indexOf("/"),
			),
		})),
};

export function createESLintConfigFile(rules: TestCaseRules) {
	const enabled = ruleValues[rules];
	const includedPluginData = Array.from(
		new Set(
			enabled
				.flatMap((enable) =>
					enable.plugin ? pluginData.get(enable.plugin) : undefined,
				)
				.filter((data) => data !== undefined),
		),
	);

	return `
import { defineConfig, globalIgnores } from "eslint/config";
${includedPluginData.map((data) => data.importer).join("\n")}
import tseslint from "typescript-eslint";

export default defineConfig(
	globalIgnores(["node_modules", "pnpm-lock.yaml", "*.config.*"]),
	tseslint.configs.base,
	${
		includedPluginData.length
			? `{
		plugins: {
			${includedPluginData.map((data) => `${data.name}: ${data.alias ?? data.name} `).join(",\n")}
		}
	},
`
			: ""
	}{
		files: ["**/*.ts"],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			${enabled.map(({ config }) => config).join(",\n")}
		}
	},
);
`;
}

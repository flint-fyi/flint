import type { TestCaseRules } from "../../testCases.ts";
import { comparedRules } from "./rules.ts";

export function createFlintConfigFile(rules: TestCaseRules) {
	return `
import { defineConfig, ts } from "flint";

export default defineConfig({
	ignore: ["node_modules", "*.config.*"],
	use: [
		{
			files: ["src/**/*.ts"],
			rules: [
				ts.rules({
					${comparedRules[rules].map(({ flint }) => `${flint}: true`).join(",\n")}
				}),
			],
		},
	],
});
`;
}

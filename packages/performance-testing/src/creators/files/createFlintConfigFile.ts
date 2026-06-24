import type { TestCaseRules } from "../../testCases.ts";
import { commonComparisons, manyComparisons } from "./rules.ts";

const ruleValues: Record<TestCaseRules, string> = {
	1: `forInArrays: true,`,
	common: commonComparisons
		.sort((a, b) => a.flint.name.localeCompare(b.flint.name))
		.map((comparison) => `${comparison.flint.name}: true`)
		.join(",\n"),
	many: manyComparisons
		.sort((a, b) => a.flint.name.localeCompare(b.flint.name))
		.map((comparison) => `${comparison.flint.name}: true`)
		.join(",\n"),
};

export function createFlintConfigFile(rules: TestCaseRules) {
	return `
import { defineConfig, ts } from "flint";

export default defineConfig({
	ignore: ["coverage/", "packages/e2e/tests/**/fixtures/**/*"],
	use: [
		{
			files: ts.files.all,
			rules: [
				ts.rules({
					${ruleValues[rules]}
				})
			]
		}
	],
});
`;
}

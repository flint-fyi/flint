import type { TestCaseRules } from "../../testCases.ts";
import { comparedRules } from "./rules.ts";

export function createOxlintConfigFile(rules: TestCaseRules): object {
	const enabled = comparedRules[rules].map(({ oxlint }) => oxlint);

	return {
		categories: {
			correctness: "off",
			nursery: "off",
			pedantic: "off",
			perf: "off",
			restriction: "off",
			style: "off",
			suspicious: "off",
		},
		options: {
			typeAware: true,
		},
		plugins: Array.from(
			new Set(enabled.map((name) => name.slice(0, name.indexOf("/")))),
		).sort(),
		rules: Object.fromEntries(enabled.map((name) => [name, "error"])),
	};
}

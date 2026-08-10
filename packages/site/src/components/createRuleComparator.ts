import type { RuleDetails } from "@flint.fyi/rule-data";

export type RuleComparator = (a: RuleDetails, b: RuleDetails) => number;

export type RuleSortBy = "name" | "preset";

export function createRuleComparator(sortBy?: RuleSortBy): RuleComparator {
	if (sortBy === "name") {
		return (a, b) => a.flint.name.localeCompare(b.flint.name);
	}

	return (a, b) => {
		if (a.flint.status === "skipped" || !a.flint.preset) {
			return 1;
		}

		if (b.flint.status === "skipped" || !b.flint.preset) {
			return -1;
		}

		if (a.flint.preset !== b.flint.preset) {
			return a.flint.preset.localeCompare(b.flint.preset);
		}

		if (a.flint.strictness !== b.flint.strictness) {
			return a.flint.strictness ? 1 : -1;
		}

		return a.flint.name.localeCompare(b.flint.name);
	};
}

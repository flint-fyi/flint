import type { Comparison } from "@flint.fyi/comparisons";

export type RuleComparator = (a: Comparison, b: Comparison) => number;

export type RuleSortBy = "name" | "preset";

export function createRuleComparator(sortBy?: RuleSortBy): RuleComparator {
	return (a, b) => {
		if (Array.isArray(a.flint) || Array.isArray(b.flint)) {
			return 0;
		}

		if (sortBy === "name") {
			return a.flint.name.localeCompare(b.flint.name);
		}

		if (a.flint.preset !== b.flint.preset) {
			if (!a.flint.preset) {
				return 1;
			}

			if (!b.flint.preset) {
				return -1;
			}

			return a.flint.preset.localeCompare(b.flint.preset);
		}

		if (a.flint.strictness !== b.flint.strictness) {
			return a.flint.strictness ? 1 : -1;
		}

		return a.flint.name.localeCompare(b.flint.name);
	};
}

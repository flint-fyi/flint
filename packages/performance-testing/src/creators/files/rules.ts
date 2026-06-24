import {
	comparisons,
	type Comparison,
	type LinterRuleReference,
} from "@flint.fyi/comparisons";

import type { TestCaseRules } from "../../testCases.ts";

export interface PotentialComparison extends Omit<Comparison, "eslint"> {
	preset: "logical";
	plugin: "ts";
	eslint: [LinterRuleReference, ...LinterRuleReference[]];
}

export interface ComparableComparisonData extends Omit<
	PotentialComparison,
	"eslint"
> {
	eslint: LinterRuleReference;
}

export const manyComparisons = comparisons
	.filter(
		(comparison): comparison is PotentialComparison =>
			["javascript", "logical", "stylistic"].includes(
				comparison.flint.preset,
			) &&
			comparison.flint.plugin === "ts" &&
			comparison.flint.status === "implemented" &&
			!!comparison.eslint,
	)
	.map(
		(comparison): ComparableComparisonData => ({
			...comparison,
			eslint: comparison.eslint!.at(-1)!,
		}),
	);

export const commonComparisons = manyComparisons.filter(
	(comparison) =>
		comparison.flint.preset === "logical" && !comparison.flint.strictness,
);

export const ruleCounts: Record<TestCaseRules, number> = {
	1: 1,
	common: commonComparisons.length,
	many: manyComparisons.length,
};

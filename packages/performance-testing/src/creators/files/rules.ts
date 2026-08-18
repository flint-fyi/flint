import {
	type FlintRuleReference,
	type LinterRuleReference,
	ruleData,
	type RuleDetails,
} from "@flint.fyi/rule-data";

import type { TestCaseRules } from "../../testCases.ts";

type ImplementedRuleReference = Exclude<
	FlintRuleReference,
	{ status: "skipped" }
>;

export interface PotentialComparison
	extends Omit<RuleDetails, "eslint" | "flint"> {
	eslint: [LinterRuleReference, ...LinterRuleReference[]];
	flint: ImplementedRuleReference;
	plugin: "ts";
	preset: "logical";
}

export interface ComparableComparisonData
	extends Omit<PotentialComparison, "eslint"> {
	eslint: LinterRuleReference;
}

export const manyComparisons = ruleData
	.filter(
		(comparison): comparison is PotentialComparison =>
			comparison.flint.status === "implemented" &&
			!!comparison.flint.preset &&
			["javascript", "logical", "stylistic"].includes(
				comparison.flint.preset,
			) &&
			comparison.flint.plugin === "ts" &&
			!!comparison.eslint,
	)
	.map(
		(comparison): ComparableComparisonData => ({
			...comparison,
			eslint: comparison.eslint.at(-1)!,
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

import { ruleData, type LinterRuleReference } from "@flint.fyi/rule-data";

import type { TestCaseRules } from "../../testCases.ts";

export interface ComparedRule {
	eslint: string;
	flint: string;
	preset: string | undefined;
	strictness: string | undefined;
}

const measuredPresets = new Set(["javascript", "logical", "stylistic"]);

const singleRuleName = "forInArrays";

function compareESLintRules(a: string, b: string) {
	return rankESLintRule(a) - rankESLintRule(b) || a.localeCompare(b);
}

function rankESLintRule(name: string) {
	if (name.startsWith("@typescript-eslint/")) {
		return 0;
	}

	return name.includes("/") ? 2 : 1;
}

// Flint rules are often mapped to several overlapping ESLint rules, such as a
// core rule and its typescript-eslint extension. Enabling all of them would
// make ESLint repeat work that Flint only does once.
function selectESLintRule(references: LinterRuleReference[]) {
	return references
		.map((reference) => reference.name)
		.reduce((selected, name) =>
			compareESLintRules(name, selected) < 0 ? name : selected,
		);
}

const comparableRules: ComparedRule[] = ruleData
	.flatMap((details): ComparedRule[] => {
		const { flint } = details;

		if (
			flint.plugin !== "ts" ||
			flint.status !== "implemented" ||
			!details.eslint?.length
		) {
			return [];
		}

		return [
			{
				eslint: selectESLintRule(details.eslint),
				flint: flint.name,
				preset: flint.preset,
				strictness: flint.strictness,
			},
		];
	})
	.sort((a, b) => a.flint.localeCompare(b.flint));

const manyRules = comparableRules.filter(
	(rule) => rule.preset !== undefined && measuredPresets.has(rule.preset),
);

const commonRules = manyRules.filter(
	(rule) => rule.preset === "logical" && !rule.strictness,
);

const singleRule = manyRules.find((rule) => rule.flint === singleRuleName);

if (!singleRule) {
	throw new Error(`No ESLint comparison is known for ts/${singleRuleName}.`);
}

export const comparedRules: Record<TestCaseRules, ComparedRule[]> = {
	1: [singleRule],
	common: commonRules,
	many: manyRules,
};

export const ruleCounts: Record<TestCaseRules, number> = {
	1: comparedRules[1].length,
	common: comparedRules.common.length,
	many: comparedRules.many.length,
};

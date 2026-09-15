import { ruleData, type LinterRuleReference } from "@flint.fyi/rule-data";

import type { TestCaseRules } from "../../testCases.ts";

export interface ComparedRule {
	eslint: string;
	flint: string;
	oxlint: string;
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

function compareOxlintRules(a: string, b: string, eslintName: string) {
	return (
		rankOxlintRule(a, eslintName) - rankOxlintRule(b, eslintName) ||
		a.localeCompare(b)
	);
}

function rankOxlintRule(name: string, eslintName: string) {
	if (name.slice(name.lastIndexOf("/") + 1) !== eslintName) {
		return 2;
	}

	return name.startsWith("typescript/") ? 0 : 1;
}

// Oxlint ports rules under the name their ESLint original uses, so preferring
// the name already selected for ESLint keeps both linters running the same
// conceptual check. A few Oxlint rules cover that ground under names of their
// own, where any of them is as close a comparison as exists.
function selectOxlintRule(references: LinterRuleReference[], eslint: string) {
	const eslintName = eslint.slice(eslint.lastIndexOf("/") + 1);

	return references
		.map((reference) => reference.name)
		.reduce((selected, name) =>
			compareOxlintRules(name, selected, eslintName) < 0 ? name : selected,
		);
}

const comparableRules: ComparedRule[] = ruleData
	.flatMap((details): ComparedRule[] => {
		const { flint } = details;

		if (
			flint.plugin !== "ts" ||
			flint.status !== "implemented" ||
			!details.eslint?.length ||
			!details.oxlint?.length
		) {
			return [];
		}

		const eslint = selectESLintRule(details.eslint);

		return [
			{
				eslint,
				flint: flint.name,
				oxlint: selectOxlintRule(details.oxlint, eslint),
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
const singleRuleDetails = ruleData.find(
	(details) =>
		details.flint.name === singleRuleName && details.flint.plugin === "ts",
);

if (!singleRule) {
	const missingLinters = [
		...(singleRuleDetails?.eslint?.length ? [] : ["ESLint"]),
		...(singleRuleDetails?.oxlint?.length ? [] : ["Oxlint"]),
	];

	throw new Error(
		`No ${missingLinters.join(" or ")} comparison is known for ts/${singleRuleName}.`,
	);
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

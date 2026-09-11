import { ruleData, type LinterRuleReference } from "@flint.fyi/rule-data";

import type { TestCaseRules } from "../../testCases.ts";
import { rslintRuleNames } from "./rslintRuleNames.ts";

export interface ComparedRule {
	biome: string[];
	eslint: string;
	flint: string;
	oxlint: string;
	preset: string | undefined;
	rslint: string;
	strictness: string | undefined;
}

const measuredPresets = new Set(["javascript", "logical", "stylistic"]);

const singleRuleName = "forInArrays";

function compareESLintRules(a: string, b: string): number {
	return rankESLintRule(a) - rankESLintRule(b) || a.localeCompare(b);
}

function rankESLintRule(name: string): number {
	if (name.startsWith("@typescript-eslint/")) {
		return 0;
	}

	return name.includes("/") ? 2 : 1;
}

// Flint rules are often mapped to several overlapping ESLint rules, such as a
// core rule and its typescript-eslint extension. Enabling all of them would
// make ESLint repeat work that Flint only does once.
function selectESLintRule(references: LinterRuleReference[]): string {
	return references
		.map((reference) => reference.name)
		.reduce((selected, name) =>
			compareESLintRules(name, selected) < 0 ? name : selected,
		);
}

function selectOxlintRule(
	references: LinterRuleReference[],
	eslint: string,
): string {
	const eslintName = eslint.slice(eslint.lastIndexOf("/") + 1);
	const oxlint = references.find(
		(reference) =>
			reference.name.slice(reference.name.lastIndexOf("/") + 1) === eslintName,
	)?.name;

	if (!oxlint) {
		throw new Error(`No matching Oxlint comparison is known for ${eslint}.`);
	}

	return oxlint;
}

const comparableRules: ComparedRule[] = ruleData
	.flatMap((details): ComparedRule[] => {
		const { flint } = details;

		if (
			flint.plugin !== "ts" ||
			flint.status !== "implemented" ||
			!details.biome?.length ||
			!details.eslint?.length ||
			!details.oxlint?.length
		) {
			return [];
		}

		const eslint = selectESLintRule(details.eslint);

		if (!rslintRuleNames.has(eslint)) {
			return [];
		}

		return [
			{
				biome: details.biome.map((reference) => reference.name),
				eslint,
				flint: flint.name,
				oxlint: selectOxlintRule(details.oxlint, eslint),
				preset: flint.preset,
				rslint: eslint,
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
	throw new Error(
		`No all-linter comparison is known for ts/${singleRuleName}.`,
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

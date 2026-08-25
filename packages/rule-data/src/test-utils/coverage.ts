import type { Rule } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";

import { findBiomeRulesInFlint, getBiomeLintRules } from "./biome.ts";
import {
	findESLintRulesInCore,
	findESLintRulesInPlugin,
	pluginsRulesByName,
} from "./eslint.ts";
import {
	findMarkdownlintRules,
	findMarkdownlintRulesInFlint,
} from "./markdownlint.ts";
import {
	findOxlintRulesInFlint,
	getOxlintLintRules,
	getOxlintRuleConfigName,
} from "./oxlint.ts";

export interface LinterRule {
	name: string;
	url: string | undefined;
}

export interface RuleCoverage {
	missing: LinterRule[];
	stale: string[];
}

export interface RuleCoverageReport {
	coverage: RuleCoverage;
	linter: string;
}

export interface RuleCoverageSource {
	collect: () => Promise<RuleCoverage> | RuleCoverage;
	linter: string;
}

const excludedESLintRulesByPluginName = new Map([
	// These rules are exported in the React plugin but not mentioned on react.dev.
	// We're treating them as an internal implementation detail for now.
	[
		"react-hooks",
		new Set([
			"capitalized-calls",
			"exhaustive-effect-dependencies",
			"fbt",
			"hooks",
			"invariant",
			"memo-dependencies",
			"memoized-effect-dependencies",
			"no-deriving-state-in-effects",
			"rule-suppression",
			"syntax",
			"todo",
			"void-use-memo",
		]),
	],
]);

export async function collectRuleCoverageReports(): Promise<
	RuleCoverageReport[]
> {
	return Promise.all(
		ruleCoverageSources.map(async ({ collect, linter }) => ({
			coverage: await collect(),
			linter,
		})),
	);
}

export function compareRuleCoverage(
	available: LinterRule[],
	covered: Iterable<string>,
): RuleCoverage {
	const availableNames = new Set(available.map((rule) => rule.name));
	const coveredNames = new Set(covered);

	return {
		missing: available
			.filter((rule) => !coveredNames.has(rule.name))
			.sort((a, b) => a.name.localeCompare(b.name)),
		stale: Array.from(coveredNames)
			.filter((name) => !availableNames.has(name))
			.sort(),
	};
}

export function formatRuleCoverage(
	linter: string,
	{ missing, stale }: RuleCoverage,
): string {
	const sections: string[] = [];

	if (missing.length) {
		sections.push(
			`**Missing from data.json (${missing.length}):**`,
			missing
				.map(({ name, url }) =>
					url ? `- [ ] [\`${name}\`](${url})` : `- [ ] \`${name}\``,
				)
				.join("\n"),
		);
	}

	if (stale.length) {
		sections.push(
			`**In data.json but no longer provided by ${linter} (${stale.length}):**`,
			stale.map((name) => `- [ ] \`${name}\``).join("\n"),
		);
	}

	return sections.join("\n\n");
}

export function hasRuleCoverageGaps({ missing, stale }: RuleCoverage): boolean {
	return Boolean(missing.length || stale.length);
}

function collectBiomeCoverage(): RuleCoverage {
	return compareRuleCoverage(
		getBiomeLintRules().map((name) => ({ name, url: undefined })),
		findBiomeRulesInFlint().map((rule) => rule.name),
	);
}

function collectESLintCoreCoverage(): RuleCoverage {
	return compareRuleCoverage(
		// builtinRules is marked as deprecated since it's in "use-at-your-own-risk", not actually deprecated
		// flint-disable-lines-begin ts/deprecated
		// eslint-disable-next-line @typescript-eslint/no-deprecated
		[...builtinRules]
			// flint-disable-lines-end ts/deprecated
			.flatMap(([name, rule]) =>
				rule.meta?.deprecated ? [] : [{ name, url: rule.meta?.docs?.url }],
			),
		findESLintRulesInCore().map((rule) => rule.name),
	);
}

function collectESLintPluginCoverage(
	pluginName: string,
	rules: object,
): RuleCoverage {
	const excludedRuleNames = excludedESLintRulesByPluginName.get(pluginName);

	return compareRuleCoverage(
		Object.entries(rules as Record<string, Rule.RuleModule>)
			.filter(([name]) => !excludedRuleNames?.has(name))
			.map(([name, rule]) => ({
				name: `${pluginName}/${name}`,
				url: rule.meta?.docs?.url,
			})),
		findESLintRulesInPlugin(pluginName).map((rule) => rule.name),
	);
}

async function collectMarkdownlintCoverage(): Promise<RuleCoverage> {
	return compareRuleCoverage(
		(await findMarkdownlintRules()).flatMap((rule) => {
			const name = rule.names.at(-1);
			return name ? [{ name, url: undefined }] : [];
		}),
		findMarkdownlintRulesInFlint().map((rule) => rule.name),
	);
}

async function collectOxlintCoverage(): Promise<RuleCoverage> {
	return compareRuleCoverage(
		(await getOxlintLintRules()).map((name) => ({ name, url: undefined })),
		findOxlintRulesInFlint().map((rule) => getOxlintRuleConfigName(rule.name)),
	);
}

export const ruleCoverageSources: RuleCoverageSource[] = [
	{ collect: collectESLintCoreCoverage, linter: "ESLint" },
	...Array.from(pluginsRulesByName, ([pluginName, rules]) => ({
		collect: () => collectESLintPluginCoverage(pluginName, rules),
		linter: pluginName,
	})),
	{ collect: collectBiomeCoverage, linter: "Biome" },
	{ collect: collectMarkdownlintCoverage, linter: "Markdownlint" },
	{ collect: collectOxlintCoverage, linter: "Oxlint" },
].sort((a, b) => a.linter.localeCompare(b.linter));

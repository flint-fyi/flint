import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { comparisons, getComparisonId } from "./index.ts";
import {
	findBiomeRulesInFlint,
	getBiomeLintRules,
} from "./test-utils/biome.ts";
import {
	findESLintRulesInCore,
	findESLintRulesInPlugin,
	pluginsRulesByName,
} from "./test-utils/eslint.ts";
import {
	findMarkdownlintRules,
	findMarkdownlintRulesInFlint,
} from "./test-utils/markdownlint.ts";

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

describe("data.json", () => {
	it("should not include any duplicate Flint rules", () => {
		const seenIds = new Set<string>();
		const duplicates: string[] = [];

		for (const comparison of comparisons) {
			const id = getComparisonId(
				comparison.flint.plugin,
				comparison.flint.name,
			);

			if (seenIds.has(id)) {
				duplicates.push(id);
			} else {
				seenIds.add(id);
			}

			expect(duplicates).toEqual([]);
		}
	});

	describe("Comparison with ESLint", () => {
		it("includes all builtin rules", () => {
			const builtinESLintRuleNames = new Set<string>(
				// builtinRules is marked as deprecated since it's in "use-at-your-own-risk", not actually deprecated
				// flint-disable-lines-begin ts/deprecated
				// eslint-disable-next-line @typescript-eslint/no-deprecated
				[...builtinRules]
					// flint-disable-lines-end ts/deprecated
					.flatMap(([ruleName, module]) =>
						!module.meta?.deprecated ? [ruleName] : [],
					)
					.sort(),
			);

			const builtinESLintRuleNamesCoveredByFlint = new Set(
				findESLintRulesInCore().map((rule) => rule.name),
			);

			expect(builtinESLintRuleNamesCoveredByFlint).toEqual(
				builtinESLintRuleNames,
			);
		});

		it.each(Array.from(pluginsRulesByName.entries()))(
			"includes all %s rules",
			(pluginName, rules) => {
				const pluginRuleNames = new Set(
					Object.keys(rules)
						.filter(
							(ruleName) =>
								!excludedESLintRulesByPluginName.get(pluginName)?.has(ruleName),
						)
						.map((ruleName) => `${pluginName}/${ruleName}`)
						.sort(),
				);

				const pluginESLintRuleNamesCoveredByFlint = new Set(
					findESLintRulesInPlugin(pluginName)
						.map((rule) => rule.name)
						.sort(),
				);

				expect(pluginESLintRuleNamesCoveredByFlint).toEqual(pluginRuleNames);
			},
		);
	});

	it("includes all Biome rules", () => {
		const biomeRuleNames = getBiomeLintRules();

		const biomeRulesCoveredByFlint = Array.from(
			new Set(findBiomeRulesInFlint().map((comparison) => comparison.name)),
		).sort();

		expect(biomeRuleNames).toEqual(biomeRulesCoveredByFlint);
	});

	it("includes all Markdownlint rules", async () => {
		const markdownlintRuleNames = (await findMarkdownlintRules())
			.map((rule) => rule.names.at(-1))
			.sort();

		const markdownlintRulesCoveredByFlint = findMarkdownlintRulesInFlint()
			.map((comparison) => comparison.name)
			.sort();

		expect(markdownlintRuleNames).toEqual(markdownlintRulesCoveredByFlint);
	});
});

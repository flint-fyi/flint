import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { comparisons, getComparisonId } from "./index.ts";
import {
	findESLintRulesInCore,
	findESLintRulesInPlugin,
	pluginsRulesByName,
} from "./test-util.ts";

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
	it("does not include any duplicate Flint rules", () => {
		const seenIds = new Set<string>();

		for (const comparison of comparisons) {
			const id = getComparisonId(
				comparison.flint.plugin,
				comparison.flint.name,
			);

			expect(seenIds).not.toContain(id);

			seenIds.add(id);
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
});

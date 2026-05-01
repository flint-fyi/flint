import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { getRuleForPluginSafe } from "./getRuleForPlugin.ts";
import { comparisons, getComparisonId } from "./index.ts";
import { groupByLinterAndPlugin } from "./test-util.ts";

const groupedData = groupByLinterAndPlugin(comparisons);

describe("data.json", () => {
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
				Object.keys(groupedData.eslint.builtin).sort(),
			);

			expect(builtinESLintRuleNamesCoveredByFlint).toEqual(
				builtinESLintRuleNames,
			);
		});
	});

	describe("Comparison with Flint", () => {
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

		describe("data matching", () => {
			const pairs = comparisons.map((comparison) => ({
				comparison,
				rule: getRuleForPluginSafe(
					comparison.flint.plugin,
					comparison.flint.name,
				),
			}));

			it("does not mark rules as implemented that do not exist yet", () => {
				expect(
					pairs.filter(
						({ comparison, rule }) =>
							!rule && comparison.flint.status === "implemented",
					),
				).toEqual([]);
			});

			it("does not miss rules as implemented that exist", () => {
				expect(
					pairs.filter(
						({ comparison, rule }) =>
							rule && comparison.flint.status !== "implemented",
					),
				).toEqual([]);
			});
		});
	});
});

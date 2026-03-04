import { comparisons, getComparisonId } from "@flint.fyi/comparisons";

const comparisonsByFlintId = Object.fromEntries(
	comparisons.flatMap((comparison) => {
		if (Array.isArray(comparison.flint)) {
			return comparison.flint.map((flint) => [
				getComparisonId(flint.plugin, flint.name),
				comparison,
			]);
		}

		return [
			[
				getComparisonId(comparison.flint.plugin, comparison.flint.name),
				comparison,
			],
		];
	}),
);

export function getComparisonByFlintId(pluginId: string, ruleId: string) {
	return comparisonsByFlintId[getComparisonId(pluginId, ruleId)];
}

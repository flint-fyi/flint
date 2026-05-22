import { comparisons, getComparisonId } from "@flint.fyi/comparisons";

const comparisonsByFlintId = new Map(
	comparisons.map((comparison) => [
		getComparisonId(comparison.flint.plugin, comparison.flint.name),
		comparison,
	]),
);

export function getComparisonByFlintId(pluginId: string, ruleId: string) {
	const comparisonId = getComparisonId(pluginId, ruleId);
	const comparison = comparisonsByFlintId.get(comparisonId);

	if (!comparison) {
		throw new Error(`Missing comparison data for: ${comparisonId}`);
	}

	return comparison;
}

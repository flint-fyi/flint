import { linterNames, type Linter } from "@flint.fyi/comparisons";
import { getComparisonByFlintId } from "./comparisonsByFlintId";
import { RuleEquivalentLinks } from "./RuleEquivalentLinks";

export interface RuleEquivalentsProps {
	pluginId: string;
	ruleId: string;
}

export function RuleEquivalents({ pluginId, ruleId }: RuleEquivalentsProps) {
	const comparison = getComparisonByFlintId(pluginId, ruleId);

	// Handle case where comparison is not found (shouldn't happen but defensive)
	if (!comparison) {
		return null;
	}

	return (
		<ul>
			{(Object.entries(linterNames) as [Linter, string][]).map(
				([linter, linterName]) =>
					comparison[linter] && (
						<li key={linter}>
							{linterName}:{" "}
							<RuleEquivalentLinks comparison={comparison} linter={linter} />
						</li>
					),
			)}
		</ul>
	);
}

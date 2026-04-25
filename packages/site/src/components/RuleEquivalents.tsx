import { linterNames, type Linter } from "@flint.fyi/comparisons";
import { getComparisonByFlintId } from "./comparisonsByFlintId";
import { RuleEquivalentLinks } from "./RuleEquivalentLinks";

export interface RuleEquivalentsProps {
	pluginId: string;
	ruleId: string;
}

export function RuleEquivalents({ pluginId, ruleId }: RuleEquivalentsProps) {
	const comparison = getComparisonByFlintId(pluginId, ruleId);

	return (
		<ul>
			{(Object.entries(linterNames) as [Linter, string][]).map(
				([linter, linterName]) => {
					if (!comparison?.[linter]) {
						console.log({ comparison, pluginId, ruleId });
					}
					return (
						comparison[linter] && (
							<li key={linter}>
								{linterName}:{" "}
								<RuleEquivalentLinks comparison={comparison} linter={linter} />
							</li>
						)
					);
				},
			)}
		</ul>
	);
}

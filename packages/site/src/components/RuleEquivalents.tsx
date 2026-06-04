import { linterNames, type LinterName } from "@flint.fyi/comparisons";

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
			{(Object.entries(linterNames) as [LinterName, string][]).map(
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

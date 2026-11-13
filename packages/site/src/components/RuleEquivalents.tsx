import type { ReactElement } from "react";

import { linterNames, type LinterName } from "@flint.fyi/rule-data";

import { getRuleDataByFlintId } from "./getRuleDataByFlintId";
import { RuleEquivalentLinks } from "./RuleEquivalentLinks";

export interface RuleEquivalentsProps {
	pluginId: string;
	ruleId: string;
}

export function RuleEquivalents({
	pluginId,
	ruleId,
}: RuleEquivalentsProps): ReactElement {
	const ruleDetails = getRuleDataByFlintId(pluginId, ruleId);

	return (
		<ul>
			{(Object.entries(linterNames) as [LinterName, string][]).map(
				([linter, linterName]) =>
					ruleDetails[linter] && (
						<li key={linter}>
							{linterName}:{" "}
							<RuleEquivalentLinks linter={linter} ruleDetails={ruleDetails} />
						</li>
					),
			)}
		</ul>
	);
}

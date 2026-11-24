import type { ReactElement } from "react";

import type { LinterName, RuleDetails } from "@flint.fyi/rule-data";

export interface RuleEquivalentLinksProps {
	linter: LinterName;
	ruleDetails: RuleDetails;
}

export function RuleEquivalentLinks({
	linter,
	ruleDetails,
}: RuleEquivalentLinksProps): ReactElement[] | undefined {
	return ruleDetails[linter]?.map((reference) => (
		<a href={reference.url} key={reference.name} target="_blank">
			<code>{reference.name}</code>
		</a>
	));
}

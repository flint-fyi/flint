import type { LinterName, RuleDetails } from "@flint.fyi/rule-data";

export interface RuleEquivalentLinksProps {
	ruleDetails: RuleDetails;
	linter: LinterName;
}

export function RuleEquivalentLinks({
	ruleDetails,
	linter,
}: RuleEquivalentLinksProps) {
	return ruleDetails[linter]?.map((reference) => (
		<a href={reference.url} key={reference.name} target="_blank">
			<code>{reference.name}</code>
		</a>
	));
}

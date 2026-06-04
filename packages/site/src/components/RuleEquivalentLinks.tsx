import type { Comparison, LinterName } from "@flint.fyi/comparisons";

export interface RuleEquivalentLinksProps {
	comparison: Comparison;
	linter: LinterName;
}

export function RuleEquivalentLinks({
	comparison,
	linter,
}: RuleEquivalentLinksProps) {
	return comparison[linter]?.map((reference) => (
		<a href={reference.url} key={reference.name} target="_blank">
			<code>{reference.name}</code>
		</a>
	));
}

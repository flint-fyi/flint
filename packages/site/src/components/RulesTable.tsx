import { getPluginDataSafe } from "~/data/pluginData";
import clsx from "clsx";

import {
	getRuleForPluginSafe,
	ruleData,
	type FlintRuleReference,
	type RuleDetails,
} from "@flint.fyi/rule-data";

import { createRuleComparator } from "./createRuleComparator";
import { InlineMarkdown } from "./InlineMarkdown";
import styles from "./RulesTable.module.css";

function renderFlintPlugin(flint: FlintRuleReference) {
	const pluginData = getPluginDataSafe(flint.plugin);

	if (!pluginData && flint.status !== "skipped") {
		throw new Error(
			`Unknown plugin ${flint.plugin} for non-skipped Flint rule ${flint.plugin}/${flint.name}.`,
		);
	}

	return pluginData ? (
		<td className={styles.linkCell}>
			<a href={`/rules/${flint.plugin}`}>
				{pluginData.plugin.name.split(" ")[0]}
			</a>
		</td>
	) : (
		<td className={styles.unknownPlugin}>
			{flint.plugin && `(${flint.plugin})`}
		</td>
	);
}

function renderFlintPreset(flint: FlintRuleReference) {
	if (flint.status === "skipped" || !flint.preset) {
		return <td className={styles.noneCell}>(none)</td>;
	}

	const hrefBase = `/rules/${flint.plugin}#${flint.preset.toLowerCase()}`;
	const [href, text] = flint.strictness
		? [`${hrefBase}strict`, `${flint.preset} (${flint.strictness})`]
		: [hrefBase, flint.preset];

	return (
		<td className={styles.linkCell}>
			<a href={href}>{text}</a>
		</td>
	);
}

function renderFlintNotes(notes: string | undefined) {
	return <td className={styles.notesCell}>{notes}</td>;
}

export interface RulesTableProps {
	implementing: boolean;
	plugin?: string;
	small?: boolean;
	sortBy?: "name" | "preset";
}

function renderFlintName(flint: FlintRuleReference) {
	return flint.status === "implemented" ? (
		<a href={`/rules/${flint.plugin}/${flint.name.toLowerCase()}`}>
			{flint.name}
		</a>
	) : (
		flint.name
	);
}

function renderFlintRuleDescription(flint: FlintRuleReference) {
	const description = getRuleForPluginSafe(flint.plugin, flint.name)?.about
		.description;

	return description ? <InlineMarkdown markdown={description} /> : null;
}

function renderImplemented(ruleData: RuleDetails[]) {
	const count = ruleData.filter(
		(ruleDetails) => ruleDetails.flint.status === "implemented",
	).length;

	return count === ruleData.length ? null : (
		<>
			Implemented: {count} of {ruleData.length} (
			{Math.trunc((count / ruleData.length) * 1000) / 10}%)
		</>
	);
}

export function RulesTable({
	implementing,
	sortBy,
	plugin,
	small,
}: RulesTableProps) {
	const comparator = createRuleComparator(sortBy);

	const values = ruleData
		.filter((ruleDetails) => {
			if ((ruleDetails.flint.status === "skipped") === implementing) {
				return false;
			}

			if (plugin && ruleDetails.flint.plugin !== plugin) {
				return false;
			}

			return true;
		})
		.sort(comparator);

	return (
		<div>
			<blockquote>
				{implementing ? (
					renderImplemented(values)
				) : (
					<>Total count: {values.length}</>
				)}
			</blockquote>
			<table
				className={clsx(
					styles.rulesTable,
					small ? styles.small : styles.normal,
				)}
			>
				<thead>
					<th>Flint Rule</th>
					{!plugin && <th>Plugin</th>}
					<th>{implementing ? "Preset" : "Notes"}</th>
				</thead>
				<tbody>
					{values.map((ruleDetails) => (
						<tr key={ruleDetails.flint.name}>
							<td
								className={clsx(
									styles.ruleNameCell,
									ruleDetails.flint.status === "implemented" &&
										styles.implementingCell,
								)}
							>
								<code>{renderFlintName(ruleDetails.flint)}</code>
								<small>{renderFlintRuleDescription(ruleDetails.flint)}</small>
							</td>
							{!plugin && renderFlintPlugin(ruleDetails.flint)}
							{implementing
								? renderFlintPreset(ruleDetails.flint)
								: renderFlintNotes(ruleDetails.notes)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

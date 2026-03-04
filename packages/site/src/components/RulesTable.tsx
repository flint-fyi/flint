import {
	comparisons,
	type FlintRuleReference,
	type Comparison,
} from "@flint.fyi/comparisons" with { type: "json" };
import clsx from "clsx";

import styles from "./RulesTable.module.css";
import { getRuleForPluginSafe } from "./getRuleForPlugin";
import { InlineMarkdown } from "./InlineMarkdown";
import { getPluginData } from "~/data/pluginData";
import { createRuleComparator } from "./createRuleComparator";

function renderFlintPlugin(flint: FlintRuleReference) {
	return (
		<td className={styles.linkCell}>
			<a href={`/rules/${flint.plugin}`}>
				{getPluginData(flint.plugin).plugin.name.split(" ")[0]}
			</a>
		</td>
	);
}

function renderFlintPreset(flint: FlintRuleReference) {
	if (!flint.preset) {
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

type FlattenedComparison = Omit<Comparison, "flint"> & {
	flint: FlintRuleReference;
};

function renderImplemented(comparisons: FlattenedComparison[]) {
	const count = comparisons.filter(
		(comparison) => comparison.flint.status === "implemented",
	).length;

	return count === comparisons.length ? null : (
		<>
			Implemented: {count} of {comparisons.length} (
			{Math.trunc((count / comparisons.length) * 1000) / 10}%)
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

	// Flatten comparisons with multiple flint rules into separate entries
	const flattenedComparisons: FlattenedComparison[] = comparisons.flatMap(
		(comparison) => {
			if (Array.isArray(comparison.flint)) {
				return comparison.flint.map((flint) => ({
					...comparison,
					flint,
				}));
			}
			return [{ ...comparison, flint: comparison.flint }];
		},
	);

	const values = flattenedComparisons
		.filter((comparison) => {
			if ((comparison.flint.status === "skipped") === implementing) {
				return false;
			}

			if (plugin && comparison.flint.plugin !== plugin) {
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
					{values.map((comparison, index) => (
						<tr
							key={`${comparison.flint.plugin}/${comparison.flint.name}-${index}`}
						>
							<td
								className={clsx(
									styles.ruleNameCell,
									comparison.flint.status === "implemented" &&
										styles.implementingCell,
								)}
							>
								<code>{renderFlintName(comparison.flint)}</code>
								<small>{renderFlintRuleDescription(comparison.flint)}</small>
							</td>
							{!plugin && renderFlintPlugin(comparison.flint)}
							{implementing
								? renderFlintPreset(comparison.flint)
								: renderFlintNotes(comparison.notes)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

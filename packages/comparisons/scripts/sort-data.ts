/* eslint perfectionist/sort-objects: ["error", {
	customGroups: [
		{
			groupName: "root",
			elementNamePattern: "^$",
		},
		{
			groupName: "flint",
			elementNamePattern: "^flint$",
		},
	],
	groups: ["root" ,"flint", "unknown"],
}] */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

import { comparisonsDataSchema, type Comparison } from "@flint.fyi/comparisons";
import { jsonCodec } from "@flint.fyi/core";

function sortItem(item: Comparison) {
	return sortKeys(item, orders);
}

const linterRuleReferenceOrder = ["name", "url"] as const;

const orders = {
	"": [
		"flint",
		"biome",
		"deno",
		"eslint",
		"markdownlint",
		"oxlint",
		"stylelint",
		"notes",
	],
	flint: ["name", "plugin", "preset", "status", "strictness"],
	biome: linterRuleReferenceOrder,
	deno: linterRuleReferenceOrder,
	eslint: linterRuleReferenceOrder,
	markdownlint: linterRuleReferenceOrder,
	oxlint: linterRuleReferenceOrder,
	stylelint: linterRuleReferenceOrder,
};

async function main() {
	const dataFilePath = path.join(import.meta.dirname, "..", "src", "data.json");

	const {
		values: { check },
	} = parseArgs({
		options: {
			check: {
				default: false,
				short: "c",
				type: "boolean",
			},
		},
	});

	const original = await fs.readFile(dataFilePath, "utf8");

	const dataOriginal = jsonCodec(comparisonsDataSchema).decode(original);

	const dataSorted = sortList(dataOriginal).map(sortItem);

	const sorted = serialize(dataSorted);

	if (original !== sorted) {
		if (check) {
			console.log(`File unsorted: ${dataFilePath}`);

			process.exitCode = 1;
		} else {
			console.log(`Writing to: ${dataFilePath}`);
			await fs.writeFile(dataFilePath, sorted);
		}
	} else {
		console.log(`File sorted correctly: ${dataFilePath}`);
	}
}

function serialize(value: unknown): string {
	return JSON.stringify(value, null, "	") + "\n";
}

function sortKeys<const T>(
	value: T,
	orders: Record<string, readonly string[]>,
	path = "",
): T {
	if (Array.isArray(value)) {
		return (value as unknown[]).map((v) => sortKeys(v, orders, path)) as T;
	}

	if (!value || typeof value !== "object") {
		return value;
	}

	const order = orders[path];
	const orderMap = order ? new Map(order.map((k, i) => [k, i])) : undefined;

	return Object.fromEntries(
		Object.entries(value)
			.toSorted(([a], [b]) => {
				if (!orderMap) {
					return a.localeCompare(b, "en-US");
				}

				return (
					(orderMap.get(a) ?? Infinity) - (orderMap.get(b) ?? Infinity) ||
					a.localeCompare(b, "en-US")
				);
			})
			.map(([k, v]) => [k, sortKeys(v, orders, path ? `${path}.${k}` : k)]),
	) as T;
}

function sortList(data: Comparison[]) {
	return data.toSorted((a, b) =>
		a.flint.plugin === b.flint.plugin
			? a.flint.name.localeCompare(b.flint.name, "en-US")
			: a.flint.plugin.localeCompare(b.flint.plugin, "en-US"),
	);
}

await main();

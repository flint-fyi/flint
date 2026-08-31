import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { isDeepStrictEqual, parseArgs } from "node:util";

import { ruleData as dataOriginal } from "@flint.fyi/rule-data" with { type: "json" };

const dataFilePath = path.join(import.meta.dirname, "../src/data.json");

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

const dataSorted = dataOriginal.toSorted((a, b) =>
	a.flint.plugin === b.flint.plugin
		? a.flint.name.localeCompare(b.flint.name)
		: a.flint.plugin.localeCompare(b.flint.plugin),
);

const dirty = !isDeepStrictEqual(dataOriginal, dataSorted);

if (dirty) {
	if (check) {
		console.log(`File unsorted: ${dataFilePath}`);

		process.exitCode = 1;
	} else {
		console.log(`Writing to: ${dataFilePath}`);
		await fs.writeFile(
			dataFilePath,
			JSON.stringify(dataSorted, null, "	") + "\n",
		);
	}
} else {
	console.log(`File sorted correctly: ${dataFilePath}`);
}

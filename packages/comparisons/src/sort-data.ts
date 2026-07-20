import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { isDeepStrictEqual, parseArgs } from "node:util";

import dataOriginal from "./data.json" with { type: "json" };
import { comparisonsDataSchema } from "./schemas.ts";

const dataFilePath = path.join(import.meta.dirname, "data.json");

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

const dataSorted = comparisonsDataSchema
	.parse(dataOriginal)
	.toSorted((a, b) =>
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

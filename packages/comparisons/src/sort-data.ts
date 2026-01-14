import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import prettier from "prettier";

import dataOriginal from "./data.json" with { type: "json" };

const dataFilePath = path.join(import.meta.dirname, "data.json");

const dataSorted = dataOriginal.toSorted((a, b) =>
	a.flint.plugin === b.flint.plugin
		? a.flint.name.localeCompare(b.flint.name)
		: a.flint.plugin.localeCompare(b.flint.plugin),
);

if (!isDeepStrictEqual(dataOriginal, dataSorted)) {
	console.log("Writing to:", dataFilePath);
	await fs.writeFile(
		dataFilePath,
		await prettier.format(JSON.stringify(dataSorted, null, 2), {
			parser: "json",
			...(await prettier.resolveConfig(dataFilePath)),
		}),
	);
}

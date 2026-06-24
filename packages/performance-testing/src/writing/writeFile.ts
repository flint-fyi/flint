import fs from "node:fs/promises";
import path from "node:path";

import prettier from "prettier";

export async function writeFile(
	directory: string,
	filePath: string,
	source: unknown,
	parser: prettier.BuiltInParserName = "typescript",
) {
	await fs.writeFile(
		path.join(directory, filePath),
		await prettier.format(
			typeof source === "string" ? source : JSON.stringify(source, null, "\t"),
			{ parser, useTabs: true },
		),
	);
}

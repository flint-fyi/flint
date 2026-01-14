import { debugForFile } from "debug-for-file";
import * as fs from "node:fs/promises";

import type { FileChange } from "../types/changes.ts";
import { applyChangesToText } from "./applyChangesToText.ts";

const log = debugForFile(import.meta.filename);

export async function applyChangesToFile(
	absoluteFilePath: string,
	changes: FileChange[],
) {
	log(
		"Collecting %d changes to apply to file: %s",
		changes.length,
		absoluteFilePath,
	);

	const updatedFileContent = applyChangesToText(
		changes,
		// TODO: Eventually, the file system should be abstracted
		// Direct fs read calls don't make sense in e.g. virtual file systems
		// https://github.com/flint-fyi/flint/issues/73
		await fs.readFile(absoluteFilePath, "utf8"),
	);

	log("Writing %d changes to file: %s", changes.length, absoluteFilePath);

	// TODO: Eventually, the file system should be abstracted
	// Direct fs write calls don't make sense in e.g. virtual file systems
	// https://github.com/flint-fyi/flint/issues/73
	await fs.writeFile(absoluteFilePath, updatedFileContent);

	log("Wrote changes to file: %s", absoluteFilePath);
}

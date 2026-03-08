import { nullThrows } from "@flint.fyi/utils";
import { debugForFile } from "debug-for-file";

import type { FileChange } from "../types/changes.ts";
import type { LinterHost } from "../types/host.ts";
import { applyChangesToText } from "./applyChangesToText.ts";

const log = debugForFile(import.meta.filename);

export async function applyChangesToFile(
	host: LinterHost,
	absoluteFilePath: string,
	changes: FileChange[],
) {
	log(
		"Collecting %d changes to apply to file: %s",
		changes.length,
		absoluteFilePath,
	);

	const fileContent = await host.readFile(absoluteFilePath);
	const updatedFileContent = applyChangesToText(
		changes,
		nullThrows(fileContent, "Expected linted file to exist."),
	);

	log("Writing %d changes to file: %s", changes.length, absoluteFilePath);

	await host.writeFile(absoluteFilePath, updatedFileContent);

	log("Wrote changes to file: %s", absoluteFilePath);
}

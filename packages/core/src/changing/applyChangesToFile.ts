import { debugForFile } from "debug-for-file";

import { nullThrows } from "@flint.fyi/utils";

import type { FileChangeset } from "../types/changes.ts";
import type { LinterHost } from "../types/host.ts";
import { applyChangesToText } from "./applyChangesToText.ts";

const log = debugForFile(import.meta.filename);

export async function applyChangesToFile(
	host: LinterHost,
	absoluteFilePath: string,
	changeset: FileChangeset,
) {
	const totalChanges = changeset.patches?.length ?? 0;

	log(
		"Collecting %d changes to apply to file: %s",
		totalChanges,
		absoluteFilePath,
	);

	const fileContent = await host.readFile(absoluteFilePath);
	const updatedFileContent = applyChangesToText(
		changeset.patches ?? [],
		nullThrows(fileContent, "Expected linted file to exist."),
	);

	log("Writing %d changes to file: %s", totalChanges, absoluteFilePath);

	await host.writeFile(absoluteFilePath, updatedFileContent);

	// should this be an actual rename?
	if (changeset.newPath !== undefined) {
		await host.renameFile(absoluteFilePath, changeset.newPath);
	}

	log("Wrote changes to file: %s", absoluteFilePath);
}

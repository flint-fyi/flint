import { debugForFile } from "debug-for-file";

import { nullThrows } from "@flint.fyi/utils";

import type { FinalizedFileResults } from "../running/finalizeFileResults.ts";
import type { FileChange } from "../types/changes.ts";
import type { LinterHost } from "../types/host.ts";
import { applyChangesToText } from "./applyChangesToText.ts";

const log = debugForFile(import.meta.url);

/**
 * Applies changes to a file on disk, unless the file changed since `fileResults` were linted:
 * its text differs from their `sourceText`, or it was touched after their cache `timestamp`.
 * @returns Whether the file was written.
 */
export async function applyChangesToFile(
	host: LinterHost,
	absoluteFilePath: string,
	changes: FileChange[],
	fileResults?: Pick<FinalizedFileResults, "sourceText" | "timestamp">,
): Promise<boolean> {
	log(
		"Collecting %d changes to apply to file: %s",
		changes.length,
		absoluteFilePath,
	);

	const fileContent = nullThrows(
		await host.readFile(absoluteFilePath),
		"Expected linted file to exist.",
	);

	if (
		await isModifiedSinceLinting(
			host,
			absoluteFilePath,
			fileContent,
			fileResults,
		)
	) {
		log(
			"Skipping changes to file modified since linting: %s",
			absoluteFilePath,
		);
		return false;
	}

	log("Writing %d changes to file: %s", changes.length, absoluteFilePath);

	await host.writeFile(
		absoluteFilePath,
		applyChangesToText(changes, fileContent),
	);

	log("Wrote changes to file: %s", absoluteFilePath);

	return true;
}

async function isModifiedSinceLinting(
	host: LinterHost,
	absoluteFilePath: string,
	fileContent: string,
	fileResults:
		Pick<FinalizedFileResults, "sourceText" | "timestamp"> | undefined,
): Promise<boolean> {
	if (fileResults?.sourceText !== undefined) {
		return fileContent !== fileResults.sourceText;
	}

	if (fileResults?.timestamp === undefined) {
		return false;
	}

	const touchTime = await host.getFileTouchTime(absoluteFilePath);
	return touchTime === undefined || touchTime > fileResults.timestamp;
}

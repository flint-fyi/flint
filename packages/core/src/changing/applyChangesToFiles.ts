import { debugForFile } from "debug-for-file";

import type { LinterHost } from "../index.ts";
import type { FinalizedFileResults } from "../running/finalizeFileResults.ts";
import { applyChangesToFile } from "./applyChangesToFile.ts";
import { resolveChangesByFile } from "./resolveChangesByFile.ts";

const log = debugForFile(import.meta.url);

/**
 * Applies fixes and requested suggestions from lint results to files on disk.
 * Files modified since they were linted are left unchanged.
 * @returns Paths of the files that were written.
 */
export async function applyChangesToFiles(
	host: LinterHost,
	filesResults: Map<string, FinalizedFileResults>,
	requestedSuggestions: Set<string>,
): Promise<string[]> {
	log("Resolving changes from results.");

	const changesByFile = resolveChangesByFile(
		filesResults,
		requestedSuggestions,
	);

	log("Resolved %d changes from results.", changesByFile.length);

	const appliedByFile = await Promise.all(
		changesByFile.map(
			async ([absoluteFilePath, fileChanges]) =>
				await applyChangesToFile(
					host,
					absoluteFilePath,
					fileChanges,
					filesResults.get(absoluteFilePath),
				),
		),
	);

	log("Finished applying changes.");

	return changesByFile
		.filter((_, index) => appliedByFile[index])
		.map(([filePath]) => filePath);
}

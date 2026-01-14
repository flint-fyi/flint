import { debugForFile } from "debug-for-file";

import type { FileResults } from "../types/linting.ts";
import { applyChangesToFile } from "./applyChangesToFile.ts";
import { resolveChangesByFile } from "./resolveChangesByFile.ts";

const log = debugForFile(import.meta.filename);

export async function applyChangesToFiles(
	filesResults: Map<string, FileResults>,
	requestedSuggestions: Set<string>,
) {
	log("Resolving changes from results.");

	const changesByFile = await resolveChangesByFile(
		filesResults,
		requestedSuggestions,
	);

	log("Resolved %d changes from results.");

	await Promise.all(
		changesByFile.map(async ([absoluteFilePath, fileChanges]) => {
			await applyChangesToFile(absoluteFilePath, fileChanges);
		}),
	);

	log("Finished applying changes.");

	return changesByFile.map(([key]) => key);
}

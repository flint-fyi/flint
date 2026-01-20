import type { FilesComputer, FilesGlobObject } from "../types/files.ts";
import { flatten } from "../utils/arrays.ts";
import { collectFilesValues } from "./collectFilesValues.ts";

/**
 * Selects all files included (and not excluded) by past config definition entries.
 */
export const all: FilesComputer = (config): FilesGlobObject => {
	const exclude = new Set<string>();
	const include = new Set<string>();

	for (const definition of config.use) {
		if (definition.files) {
			collectFilesValues(flatten(definition.files), exclude, include);
		}
	}

	return {
		exclude: Array.from(exclude),
		include: Array.from(include),
	};
};

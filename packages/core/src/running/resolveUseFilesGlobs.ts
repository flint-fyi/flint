import { collectFilesValues } from "../globs/collectFilesValues.ts";
import type { AnyLevelDeep } from "../types/arrays.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { FilesGlobObjectProcessed, FilesValue } from "../types/files.ts";
import { flatten } from "../utils/arrays.ts";

export function resolveUseFilesGlobs(
	files: AnyLevelDeep<FilesValue> | undefined,
	configDefinition: ProcessedConfigDefinition,
): FilesGlobObjectProcessed {
	const globs = collectUseFilesGlobsObject(files, configDefinition);

	return {
		exclude: [...globs.exclude, ...(configDefinition.ignore ?? [])],
		include: globs.include,
	};
}

function collectUseFilesGlobsObject(
	files: AnyLevelDeep<FilesValue> | undefined,
	configDefinition: ProcessedConfigDefinition,
): FilesGlobObjectProcessed {
	switch (typeof files) {
		case "function":
			return resolveUseFilesGlobs(files(configDefinition), configDefinition);

		case "undefined":
			return { exclude: [], include: [] };

		default: {
			const exclude = new Set<string>();
			const include = new Set<string>();

			collectFilesValues(flatten(files), exclude, include);

			return {
				exclude: Array.from(exclude),
				include: Array.from(include),
			};
		}
	}
}

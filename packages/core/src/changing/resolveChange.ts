import type { Change, ResolvedChangeset } from "../types/changes.ts";
import { isSuggestionForFiles } from "../utils/predicates.ts";

export function resolveChange(
	change: Change,
	sourceFilePath: string,
): ResolvedChangeset {
	if (!isSuggestionForFiles(change)) {
		return {
			patches: [
				{
					...change,
					filePath: sourceFilePath,
				},
			],
		};
	}

	const patches = Object.entries(change.files).flatMap(
		([filePath, fileChanges]) => {
			const changes = Array.isArray(fileChanges)
				? fileChanges
				: fileChanges.patches;

			if (changes === undefined) {
				return [];
			}

			return changes.map((fileChange) => ({
				...fileChange,
				filePath,
			}));
		},
	);

	return { patches };
}

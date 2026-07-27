import type { Change, ResolvedChange } from "../types/changes.ts";
import { isSuggestionForFiles } from "../utils/predicates.ts";

export function resolveChange(
	change: Change,
	sourceFilePath: string,
): ResolvedChange[] {
	if (!isSuggestionForFiles(change)) {
		return [
			{
				...change,
				filePath: sourceFilePath,
			},
		];
	}

	return Object.entries(change.files).flatMap(([filePath, fileChanges]) => {
		if (fileChanges === undefined) {
			return [];
		}

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
	});
}

import type { Change, ResolvedChange } from "../types/changes.ts";
import { isSuggestionForFiles } from "../utils/predicates.ts";

export function resolveChange(
	change: Change,
	sourceFilePath: string,
): ResolvedChange | ResolvedChange[] {
	if (!isSuggestionForFiles(change)) {
		return {
			...change,
			filePath: sourceFilePath,
		};
	}

	return Object.entries(change.files).flatMap(
		([filePath, fileChanges = []]) => {
			return fileChanges.map((fileChange) => ({
				...fileChange,
				filePath,
			}));
		},
	);
}

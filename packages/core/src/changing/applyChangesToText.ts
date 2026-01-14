import type { FileChange } from "../types/changes.ts";
import { applyFileChangeToText } from "./applyChangeToText.ts";
import { orderChangesLastToFirstWithoutOverlaps } from "./ordering.ts";

export function applyChangesToText(changes: FileChange[], text: string) {
	const changesOrdered = orderChangesLastToFirstWithoutOverlaps(changes);

	return changesOrdered.reduce(
		(updatedFileContent, change) =>
			applyFileChangeToText(change, updatedFileContent),
		text,
	);
}

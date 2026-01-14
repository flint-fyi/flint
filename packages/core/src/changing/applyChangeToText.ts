import type { FileChange } from "../types/changes.ts";

export function applyFileChangeToText(change: FileChange, text: string) {
	return (
		text.slice(0, change.range.begin) +
		change.text +
		text.slice(change.range.end)
	);
}

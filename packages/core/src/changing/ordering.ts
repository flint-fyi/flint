import { nullThrows } from "@flint.fyi/utils";

import type { FileChange } from "../types/changes.ts";

export const orderChangesLastToFirstWithoutOverlaps = (
	changes: FileChange[],
): FileChange[] => {
	const ordered = changes.toSorted((a, b) => a.range.end - b.range.end);
	const orderedWithoutOverlaps: FileChange[] = [];
	let lastStart = Infinity;

	for (let i = ordered.length - 1; i >= 0; i -= 1) {
		const change = nullThrows(
			ordered[i],
			"Change is expected to be present by the loop condition",
		);
		if (change.range.end > lastStart) {
			continue;
		}

		lastStart = change.range.begin;
		orderedWithoutOverlaps.push(change);
	}

	return orderedWithoutOverlaps;
};

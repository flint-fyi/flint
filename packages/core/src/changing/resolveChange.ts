import * as fs from "node:fs/promises";

import type { Change, ResolvedChange } from "../types/changes.ts";
import { isSuggestionForFiles } from "../utils/predicates.ts";

export async function resolveChange(
	change: Change,
	sourceFilePath: string,
): Promise<ResolvedChange | ResolvedChange[]> {
	if (!isSuggestionForFiles(change)) {
		return {
			...change,
			filePath: sourceFilePath,
		};
	}

	return (
		await Promise.all(
			Object.entries(change.files).flatMap(async ([filePath, generator]) => {
				// TODO: Eventually, the file system should be abstracted
				// Direct fs read calls don't make sense in e.g. virtual file systems
				// https://github.com/flint-fyi/flint/issues/73
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const fileChanges = generator!(await fs.readFile(filePath, "utf8"));

				return fileChanges.map((fileChange) => ({
					filePath,
					...fileChange,
				}));
			}),
		)
	).flat();
}

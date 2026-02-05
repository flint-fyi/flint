import { nullThrows } from "@flint.fyi/utils";

import type { Change, ResolvedChange } from "../types/changes.ts";
import type { LinterHost } from "../types/host.ts";
import { isSuggestionForFiles } from "../utils/predicates.ts";

export async function resolveChange(
	host: LinterHost,
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
				const gen = nullThrows(
					generator,
					"Expected suggestion generator to exist",
				);
				const file = await host.readFile(filePath);
				const fileChanges = gen(nullThrows(file, "Expected file to exist"));

				return fileChanges.map((fileChange) => ({
					filePath,
					...fileChange,
				}));
			}),
		)
	).flat();
}

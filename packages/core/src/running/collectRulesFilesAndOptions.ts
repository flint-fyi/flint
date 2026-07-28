import { nullThrows } from "@flint.fyi/utils";

import type { AnyRule } from "../types/rules.ts";
import type { LanguageAndFile, LanguageFilesWithOptions } from "./types.ts";

export function collectRulesFilesAndOptions(
	rulesOptionsByFile: Map<AnyRule, Map<string, unknown>>,
	languageFilesByFilePath: Map<string, LanguageAndFile[]>,
) {
	const rulesFilesAndOptionsByRule = new Map<
		AnyRule,
		LanguageFilesWithOptions[]
	>();

	for (const [rule, optionsByFile] of rulesOptionsByFile) {
		const filesAndOptions: LanguageFilesWithOptions[] = [];

		for (const [filePath, options] of optionsByFile) {
			const languageAndFiles = languageFilesByFilePath.get(filePath);
			if (languageAndFiles == null) {
				continue;
			}

			filesAndOptions.push({
				languageFiles: Array.from(
					nullThrows(
						languageAndFiles,
						"Language file is expected to be present by the map",
					).values(),
				),
				options,
			});
		}

		if (filesAndOptions.length) {
			rulesFilesAndOptionsByRule.set(rule, filesAndOptions);
		}
	}

	return rulesFilesAndOptionsByRule;
}

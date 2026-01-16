import type { FileDiskData, LanguageFileDefinition } from "@flint.fyi/core";

import type { TextFileServices, TextNodes } from "./types.ts";

export function createTextFile(
	data: FileDiskData,
): LanguageFileDefinition<TextNodes, TextFileServices> {
	return {
		about: data,
		runVisitors(options, runtime) {
			if (!runtime.visitors) {
				return;
			}

			const fileServices = {
				filePathAbsolute: data.filePathAbsolute,
				options,
				sourceText: data.sourceText,
			};

			runtime.visitors.file?.(data.sourceText, fileServices);

			if (runtime.visitors.line) {
				for (const line of data.sourceText.split(/\r\n|\n|\r/)) {
					runtime.visitors.line(line, fileServices);
				}
			}
		},
	};
}

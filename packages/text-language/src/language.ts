import { createLanguage } from "@flint.fyi/core";

import { createTextFile } from "./createTextFile.ts";
import type { TextFileServices, TextNodes } from "./types.ts";

export const textLanguage = createLanguage<TextNodes, TextFileServices>({
	about: {
		name: "Text",
	},
	createFileFactory: () => {
		return {
			prepareFile: (data) => {
				return {
					file: createTextFile(data),
				};
			},
		};
	},
});

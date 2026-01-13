import { createLanguage } from "@flint.fyi/core";
import fsSync from "node:fs";

import { createTextFile } from "./createTextFile.ts";
import type { TextFileServices, TextNodes } from "./types.ts";

export const textLanguage = createLanguage<TextNodes, TextFileServices>({
	about: {
		name: "Text",
	},
	createFileFactory: () => {
		return {
			prepareFromDisk: (data) => {
				return {
					file: createTextFile({
						...data,
						sourceText: fsSync.readFileSync(data.filePathAbsolute, "utf8"),
					}),
				};
			},
			prepareFromVirtual: (data) => {
				return {
					file: createTextFile(data),
				};
			},
		};
	},
});

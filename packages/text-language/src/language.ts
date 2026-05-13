import { createLanguage } from "@flint.fyi/core";

import type { TextFileServices, TextNodes } from "./types.ts";

export const textLanguage = createLanguage<TextNodes, TextFileServices>({
	about: {
		name: "Text",
	},
	createFileFactory: () => {
		return {
			createFile: (data) => {
				return {
					about: data,
					services: data,
				};
			},
		};
	},
	runFileVisitors: (file, options, runtime) => {
		if (!runtime.visitors) {
			return;
		}

		const visitorServices = { options, ...file.services };

		runtime.visitors.file?.(file.services.sourceText, visitorServices);

		if (runtime.visitors.line) {
			for (const line of file.services.sourceText.split(/\r\n|\n|\r/)) {
				runtime.visitors.line(line, visitorServices);
			}
		}
	},
});

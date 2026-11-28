import { createLanguage, type Language } from "@flint.fyi/core";

import type { TextFileServices, TextNodes } from "./types.ts";

export const textLanguage: Language<TextNodes, TextFileServices> =
	createLanguage({
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
		runFileVisitors: (file, fileVisitors) => {
			const { sourceText } = file.services;
			let lines: string[] | undefined;

			for (const useFileVisitors of fileVisitors) {
				useFileVisitors((services, visitors) => {
					visitors.file?.(sourceText, services);

					if (!visitors.line) {
						return;
					}

					lines ??= sourceText.split(/\r\n|\n|\r/);

					for (const line of lines) {
						visitors.line(line, services);
					}
				});
			}
		},
	});

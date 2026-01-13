import * as fs from "node:fs/promises";

import type { RendererFactory } from "./types.ts";

export const singleRendererFactory: RendererFactory = {
	about: {
		name: "single",
	},
	initialize(presenter) {
		return {
			announce() {
				for (const line of presenter.header) {
					console.log(line);
				}
			},
			async render({ formattingResults, lintResults }) {
				for (const [filePath, fileResults] of lintResults.filesResults) {
					if (!fileResults.reports.length) {
						continue;
					}

					const sourceFileText = await fs.readFile(filePath, "utf-8");

					const body = presenter.renderFile({
						file: {
							filePath,
							text: sourceFileText,
						},
						reports: fileResults.reports,
					});

					for (const line of await Array.fromAsync(body)) {
						process.stdout.write(line);
					}
				}

				const summary = presenter.summarize({
					formattingResults,
					lintResults,
				});

				for (const line of await Array.fromAsync(summary)) {
					process.stdout.write(line);
				}
			},
		};
	},
};

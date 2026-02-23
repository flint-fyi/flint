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
				const fileContexts = await Promise.all(
					Array.from(lintResults.filesResults).map(
						async ([filePath, fileResults]) => {
							if (!fileResults.reports.length) {
								return;
							}
							const sourceFileText = await fs.readFile(filePath, "utf-8");

							return {
								file: {
									filePath,
									text: sourceFileText,
								},
								reports: fileResults.reports,
							};
						},
					),
				);

				for (const context of fileContexts) {
					if (context === undefined) {
						continue;
					}

					const body = presenter.renderFile(context);

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

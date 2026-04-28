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
			async render({ duration, formattingResults, lintResults }) {
				const fileContexts = await Promise.all(
					lintResults.filesResults
						.entries()
						.map(async ([filePath, fileResults]) => {
							if (!fileResults.reports.length) {
								return undefined;
							}

							// TODO: Can we re-use the sourcefile representation?
							const sourceFileText = await fs.readFile(filePath, "utf-8");
							return {
								file: {
									filePath,
									text: sourceFileText,
								},
								reports: fileResults.reports,
							};
						}),
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
					duration,
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

import type { LintResults } from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/core";
import debounce from "debounce";
import { debugForFile } from "debug-for-file";
import * as fs from "node:fs";

import type { OptionsValues } from "./options.ts";
import type { Renderer } from "./renderers/types.ts";
import { runCliOnce } from "./runCliOnce.ts";

const log = debugForFile(import.meta.filename);

export async function runCliWatch(
	configFileName: string,
	getRenderer: () => Renderer,
	values: OptionsValues,
) {
	const abortController = new AbortController();
	const cwd = process.cwd();

	log("Running single-run CLI once before watching");

	return new Promise<void>((resolve) => {
		let currentLintResults: LintResults | undefined;
		let currentRenderer: Renderer;

		function startNewTask() {
			const renderer = getRenderer();
			currentRenderer = renderer;

			runCliOnce(configFileName, renderer, values).then(
				({ lintResults }) => {
					if (currentRenderer === renderer) {
						currentLintResults = lintResults;
					}
				},
				(error: unknown) => {
					log("Error during lint run: %o", error);
				},
			);

			renderer.onQuit?.(() => {
				abortController.abort();
				resolve();
			});

			return renderer;
		}

		currentRenderer = startNewTask();

		const rerun = debounce((fileName: string) => {
			if (fileName.startsWith("node_modules/.cache")) {
				log(
					"Skipping re-running watch mode for ignored change to: %s",
					fileName,
				);
				return;
			}

			const normalizedPath = normalizePath(fileName, true);

			const shouldRerun = shouldRerunForFileChange(
				normalizedPath,
				currentLintResults,
			);

			if (!shouldRerun) {
				log(
					"Skipping re-running watch mode for unrelated file change: %s",
					fileName,
				);
				return;
			}

			log("Change detected from: %s", fileName);
			currentRenderer.dispose?.();
			currentRenderer = startNewTask();
		}, 100);

		log("Watching cwd:", cwd);
		fs.watch(
			cwd,
			{
				recursive: true,
				signal: abortController.signal,
			},
			(_, fileName) => {
				if (fileName) {
					rerun(fileName);
				}
			},
		);
	});
}

function shouldRerunForFileChange(
	changedFilePath: string,
	lintResults: LintResults | undefined,
): boolean {
	if (!lintResults) {
		return true;
	}

	if (lintResults.filesResults.has(changedFilePath)) {
		return true;
	}

	for (const fileResult of lintResults.filesResults.values()) {
		if (fileResult.dependencies.has(changedFilePath)) {
			return true;
		}
	}

	return false;
}

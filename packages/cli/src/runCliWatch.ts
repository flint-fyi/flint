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
		let currentTask = startNewTask();

		function startNewTask() {
			const renderer = getRenderer();
			const runner = runCliOnce(configFileName, renderer, values).then(
				(result) => {
					currentLintResults = result.lintResults;
					return result.exitCode;
				},
			);

			renderer.onQuit?.(() => {
				abortController.abort();
				resolve();
			});

			return { renderer, runner };
		}

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
			currentTask.renderer.dispose?.();
			currentTask = startNewTask();
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

	for (const filePath of lintResults.filesResults.keys()) {
		if (filePath === changedFilePath) {
			return true;
		}
	}

	for (const fileResult of lintResults.filesResults.values()) {
		for (const dependency of fileResult.dependencies) {
			if (dependency === changedFilePath) {
				return true;
			}
		}
	}

	return false;
}

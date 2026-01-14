import { getMemoryCache, normalizePath } from "@flint.fyi/core";
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
		let currentTask = startNewTask();

		function startNewTask() {
			const renderer = getRenderer();
			const runner = runCliOnce(configFileName, renderer, values);

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

			const shouldRerun = shouldRerunForFileChange(normalizedPath);

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

function shouldRerunForFileChange(changedFilePath: string): boolean {
	const memoryCache = getMemoryCache();

	if (!memoryCache) {
		return true;
	}

	for (const filePath of Object.keys(memoryCache.files)) {
		if (filePath === changedFilePath) {
			return true;
		}
	}

	for (const fileStorage of Object.values(memoryCache.files)) {
		if (fileStorage.dependencies) {
			for (const dep of fileStorage.dependencies) {
				if (dep === changedFilePath) {
					return true;
				}
			}
		}
	}

	return false;
}

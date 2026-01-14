import {
	cacheFilePath,
	type CacheStorage,
	normalizePath,
	readFileSafeAsJson,
} from "@flint.fyi/core";
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

		const rerun = debounce(async (fileName: string) => {
			if (fileName.startsWith("node_modules/.cache")) {
				log(
					"Skipping re-running watch mode for ignored change to: %s",
					fileName,
				);
				return;
			}

			const normalizedPath = normalizePath(fileName, true);

			const shouldRerun = await shouldRerunForFileChange(
				normalizedPath,
				cacheFilePath,
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
					void rerun(fileName);
				}
			},
		);
	});
}

async function shouldRerunForFileChange(
	changedFilePath: string,
	cacheFilePath: string,
): Promise<boolean> {
	// TODO: Add some kind of validation to cache data
	// https://github.com/flint-fyi/flint/issues/114
	const cache = (await readFileSafeAsJson(cacheFilePath)) as
		| CacheStorage
		| undefined;
	if (!cache) {
		return true;
	}

	for (const filePath of Object.keys(cache.files)) {
		if (filePath === changedFilePath) {
			return true;
		}
	}

	for (const fileStorage of Object.values(cache.files)) {
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

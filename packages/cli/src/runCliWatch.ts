import type { LintResults } from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/core";
import { debugForFile } from "debug-for-file";
import * as fs from "node:fs/promises";
import pDebounce from "p-debounce";

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

	let currentLintResults: LintResults | undefined;
	let currentRenderer: Renderer;

	async function startNewTask() {
		const renderer = getRenderer();
		currentRenderer = renderer;

		// Register onQuit immediately before lint run starts
		renderer.onQuit?.(() => {
			abortController.abort();
		});

		try {
			const { lintResults } = await runCliOnce(
				configFileName,
				renderer,
				values,
			);

			if (currentRenderer === renderer) {
				currentLintResults = lintResults;
			}
		} catch (error) {
			log("Error during lint run: %o", error);
		}

		return renderer;
	}

	currentRenderer = await startNewTask();

	const rerun = pDebounce(
		async (fileName: string) => {
			const normalizedPath = normalizePath(fileName, true);

			if (normalizedPath.startsWith("node_modules/.cache")) {
				log(
					"Skipping re-running watch mode for ignored change to: %s",
					fileName,
				);
				return;
			}

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
			currentRenderer = await startNewTask();
		},
		100,
		{ signal: abortController.signal },
	);

	log("Watching cwd:", cwd);

	try {
		for await (const { filename } of fs.watch(cwd, {
			recursive: true,
			signal: abortController.signal,
		})) {
			if (filename) {
				await rerun(filename);
			}
		}
	} catch (error) {
		// AbortError is expected when quitting - just exit cleanly
		if (error instanceof Error && error.name === "AbortError") {
			return;
		}
		throw error;
	}
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

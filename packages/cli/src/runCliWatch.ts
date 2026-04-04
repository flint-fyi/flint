import type { LinterHost, LintResults } from "@flint.fyi/core";
import { pathKey } from "@flint.fyi/utils";
import debounce from "debounce";
import { debugForFile } from "debug-for-file";

import type { OptionsValues } from "./options.ts";
import type { Renderer } from "./renderers/types.ts";
import { runCliOnce } from "./runCliOnce.ts";

const log = debugForFile(import.meta.filename);

export async function runCliWatch(
	host: LinterHost,
	configFileName: string,
	getRenderer: () => Renderer,
	values: OptionsValues,
) {
	const cwd = host.getCurrentDirectory();
	const isCaseSensitiveFS = host.isCaseSensitiveFS();

	log("Running single-run CLI once before watching");

	return new Promise<void>((resolve) => {
		let currentLintResults: LintResults | undefined;
		let currentRenderer: Renderer;

		function startNewTask(initial = false) {
			const renderer = getRenderer();
			currentRenderer = renderer;

			runCliOnce(
				host,
				configFileName,
				renderer,
				initial ? values : { ...values, "cache-ignore": false },
			).then(
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
				watcher[Symbol.dispose]();
				resolve();
			});

			return renderer;
		}

		currentRenderer = startNewTask(true);

		const rerun = debounce((fileName: string) => {
			const normalizedPath = pathKey(fileName, isCaseSensitiveFS);

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
		const watcher = host.watchDirectorySync(cwd, rerun, {
			recursive: true,
		});
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

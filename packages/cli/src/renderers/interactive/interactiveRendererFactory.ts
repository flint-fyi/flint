import { nullThrows } from "@flint.fyi/utils";
import cliCursor from "cli-cursor";
import readline from "node:readline";

import type { RendererContext, RendererFactory } from "../types.ts";
import { createListeners } from "./createListeners.ts";
import { createState } from "./createState.ts";
import { printAllClear } from "./printAllClear.ts";
import { printControls } from "./printControls.ts";
import { printFile } from "./printFile.ts";
import { printHeader } from "./printHeader.ts";
import { printSummary } from "./printSummary.ts";

export const interactiveRendererFactory: RendererFactory = {
	about: {
		name: "interactive",
	},
	initialize(presenter) {
		const onDisposeListeners = createListeners();
		const onQuitListeners = createListeners();
		const [getFile, setFile] = createState(0);

		cliCursor.hide();
		process.stdin.setRawMode(true);
		process.stdin.resume();
		readline.emitKeypressEvents(process.stdin);

		function announce() {
			console.clear();

			for (const line of presenter.header) {
				console.log(line);
			}
		}

		function dispose() {
			cliCursor.show();
			onDisposeListeners.call();
			process.stdin.pause();
			process.stdin.setRawMode(false);
		}

		function quit() {
			console.log("Exiting interactive mode.");
			onQuitListeners.call();
		}

		async function render({ lintResults }: RendererContext) {
			const filesWithReportResults = Array.from(
				lintResults.filesResults,
			).filter(([, results]) => results.reports.length);

			const events: Record<string, (() => boolean) | undefined> = {
				left: () => setFile(Math.max(0, getFile() - 1)),
				right: () =>
					setFile(Math.min(filesWithReportResults.length - 1, getFile() + 1)),
			};

			await rerender();

			return new Promise<void>((resolve) => {
				let currentTask: Promise<void> | undefined;

				onDisposeListeners.add(offKeyPress);
				onQuitListeners.add(offKeyPress);
				process.stdin.on("keypress", onKeyPress);

				function offKeyPress() {
					process.stdin.off("keypress", onKeyPress);
				}

				function onKeyPress(chunk: string, key: { name: string }) {
					if (chunk === "\x03" || key.name === "q") {
						dispose();
						quit();
						resolve();
						return;
					}

					if (events[key.name]?.()) {
						queueRerender();
					}

					return;
				}

				function queueRerender() {
					if (currentTask) {
						currentTask = currentTask.then(() => rerender());
					} else {
						currentTask = rerender();
					}
				}
			});

			async function rerender() {
				console.clear();
				announce();

				if (!filesWithReportResults.length) {
					console.log(printAllClear());
					return;
				}

				const [filePath, fileResults] = nullThrows(
					filesWithReportResults[getFile()],
					"File is expected to be present",
				);

				console.log(
					[
						printHeader(getFile(), filesWithReportResults.length),
						printControls(getFile(), filesWithReportResults.length),
						"",
						await printFile(filePath, presenter, fileResults.reports),
						"",
						printSummary(filesWithReportResults),
					].join("\n"),
				);
			}
		}

		return {
			announce,
			dispose,
			onQuit(callback) {
				onQuitListeners.add(callback);
			},
			render,
		};
	},
};

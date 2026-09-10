import path from "node:path";

import debounce from "debounce";
import { debugForFile } from "debug-for-file";

import {
	applyChangesToFiles,
	LintSession,
	maximumFixIterations,
	nodeModulesCache,
	vcsDirectories,
	writeToCache,
	type LinterHost,
	type LintResultsWithChanges,
	type ProcessedConfigDefinition,
} from "@flint.fyi/core";
import { pathKey } from "@flint.fyi/utils";

import { loadConfigDefinition } from "./loadConfigDefinition.ts";
import type { OptionsValues } from "./options.ts";
import { renderCliResults } from "./renderCliResults.ts";
import type { Renderer } from "./renderers/types.ts";

const log = debugForFile(import.meta.filename);

export async function runCliWatch(
	host: LinterHost,
	configFileName: string,
	getRenderer: () => Renderer,
	values: OptionsValues,
): Promise<void> {
	const cwd = host.getCurrentDirectory();
	const isCaseSensitiveFS = host.isCaseSensitiveFS();

	return new Promise<void>((resolve) => {
		let configDefinition: ProcessedConfigDefinition | undefined;
		let currentRenderer: Renderer | undefined;
		let currentTask = Promise.resolve(undefined);
		let importVersion = 0;
		let lintSession: LintSession | undefined;
		let quitting = false;

		const knownUnrelatedFilePaths = new Set<string>();
		const pendingChanges = new Map<string, string>();

		function finish() {
			if (quitting) {
				return;
			}

			quitting = true;
			processPendingChanges.clear();
			pendingChanges.clear();
			watcher[Symbol.dispose]();

			currentTask = currentTask.finally(() => {
				currentRenderer?.dispose?.();
				lintSession?.[Symbol.dispose]();
				resolve();
			});
		}

		function createRenderer() {
			currentRenderer?.dispose?.();

			const renderer = getRenderer();
			currentRenderer = renderer;
			renderer.onQuit?.(finish);
			return renderer;
		}

		function queueTask<Result>(task: () => Promise<Result>) {
			currentTask = currentTask
				.then(task, task)
				.then(() => undefined)
				.catch((error: unknown) => {
					log("Error during lint run: %o", error);
					return undefined;
				});
		}

		async function rebuildSession() {
			currentRenderer?.dispose?.();
			currentRenderer = undefined;
			lintSession?.[Symbol.dispose]();
			lintSession = undefined;
			knownUnrelatedFilePaths.clear();

			configDefinition = await loadConfigDefinition(
				host,
				configFileName,
				importVersion++,
			);
			if (configDefinition === undefined) {
				return;
			}

			lintSession = await LintSession.create(configDefinition, host);
		}

		function createLintResults(
			session: LintSession,
			changed: Set<string>,
		): LintResultsWithChanges {
			return {
				allFilePaths: session.allFilePaths,
				allFileResults: new Map(session.storedResults),
				cached: undefined,
				changed,
				ruleCount: session.ruleCount,
			};
		}

		async function lintFiles(session: LintSession, filePaths?: Set<string>) {
			const changed = new Set<string>();
			const formatFilePaths = new Set<string>();
			const lintOptions = {
				skipLanguageReports: values["skip-language-reports"] ?? false,
			};

			async function runIteration(
				nextFilePaths: Set<string> | undefined,
				iteration: number,
			): Promise<void> {
				const filesResults =
					nextFilePaths == null
						? await session.lintAll(lintOptions)
						: await session.lintChangedFiles(nextFilePaths, lintOptions);

				for (const filePath of filesResults.keys()) {
					formatFilePaths.add(filePath);
				}

				if (!values.fix || iteration >= maximumFixIterations) {
					return;
				}

				const fixedFilePaths = await applyChangesToFiles(
					host,
					filesResults,
					new Set(values["fix-suggestions"]),
				);
				if (!fixedFilePaths.length) {
					return;
				}

				for (const filePath of fixedFilePaths) {
					changed.add(filePath);
					formatFilePaths.add(filePath);
				}

				await runIteration(new Set(fixedFilePaths), iteration + 1);
			}

			await runIteration(filePaths, 0);

			return { changed, formatFilePaths };
		}

		async function run({
			filePaths,
			rebuild,
		}: {
			filePaths?: Set<string>;
			rebuild: boolean;
		}) {
			if (quitting) {
				return;
			}

			if (rebuild || lintSession == null) {
				await rebuildSession();
			}
			if (lintSession == null || configDefinition == null) {
				return;
			}

			const renderer = createRenderer();
			renderer.announce();

			const startTime = performance.now();
			const { changed, formatFilePaths } = await lintFiles(
				lintSession,
				filePaths,
			);
			const lintResults = createLintResults(lintSession, changed);

			await writeToCache(
				host,
				configFileName,
				lintResults,
				values["cache-location"] || configDefinition.cacheLocation,
			);

			if (currentRenderer !== renderer) {
				return lintSession;
			}

			await renderCliResults(host, lintResults, renderer, values, {
				formatFilePaths,
				ignoreCache: values["cache-ignore"] ?? false,
				startTime,
			});

			return lintSession;
		}

		async function processChanges(changedFilePaths: string[]) {
			if (
				changedFilePaths.some((filePath) =>
					isStructuralFile(filePath, configFileName, cwd),
				)
			) {
				log("Rebuilding watch session after a structural file change.");
				await run({ rebuild: true });
				return;
			}

			if (lintSession == null) {
				await run({ rebuild: true });
				return;
			}

			const filePaths = new Set<string>();
			let filesetChanged = false;

			for (const changedFilePath of changedFilePaths) {
				if (lintSession.hasFilePath(changedFilePath)) {
					if (host.fileTypeSync(changedFilePath) !== "file") {
						filesetChanged = true;
						break;
					}
					filePaths.add(changedFilePath);
				} else if (lintSession.hasDependents(changedFilePath)) {
					if (host.fileTypeSync(changedFilePath) == null) {
						filesetChanged = true;
						break;
					}
					filePaths.add(changedFilePath);
				} else if (
					!knownUnrelatedFilePaths.has(
						pathKey(changedFilePath, isCaseSensitiveFS),
					)
				) {
					filesetChanged = true;
					break;
				}
			}

			if (filesetChanged) {
				log("Rebuilding watch session after a possible fileset change.");
				const rebuiltSession = await run({ rebuild: true });

				if (rebuiltSession != null) {
					for (const filePath of changedFilePaths) {
						if (
							!rebuiltSession.hasFilePath(filePath) &&
							!rebuiltSession.hasDependents(filePath)
						) {
							knownUnrelatedFilePaths.add(pathKey(filePath, isCaseSensitiveFS));
						}
					}
				}
				return;
			}

			if (!filePaths.size) {
				log(
					"Skipping watch run for unrelated file changes: %o",
					changedFilePaths,
				);
				return;
			}

			log("Re-linting after file changes: %o", changedFilePaths);
			await run({ filePaths, rebuild: false });
		}

		const processPendingChanges = debounce(() => {
			const changes = Array.from(pendingChanges.values());
			pendingChanges.clear();
			queueTask(() => processChanges(changes));
		}, 100);

		log("Watching cwd:", cwd);
		const watcher = host.watchDirectorySync(
			cwd,
			(filePath) => {
				const normalizedPath = pathKey(filePath, isCaseSensitiveFS);
				pendingChanges.set(normalizedPath, filePath);
				processPendingChanges();
			},
			{
				ignoredPaths: [nodeModulesCache, ...vcsDirectories],
				recursive: true,
			},
		);

		log("Running initial watch lint.");
		queueTask(() => run({ rebuild: true }));
	});
}

function isStructuralFile(
	filePath: string,
	configFileName: string,
	cwd: string,
) {
	const baseName = path.basename(filePath);

	return (
		filePath === path.resolve(cwd, configFileName) ||
		baseName === "package.json" ||
		/^tsconfig(?:\..+)?\.json$/u.test(baseName)
	);
}

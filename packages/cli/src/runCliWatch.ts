import path from "node:path";

import debounce from "debounce";
import { debugForFile } from "debug-for-file";

import {
	applyChangesToFiles,
	LintSession,
	lintSessionWithCache,
	maximumFixIterations,
	nodeModulesCache,
	vcsDirectories,
	writeToCache,
	type LinterHost,
	type LintResults,
	type ProcessedConfigDefinition,
} from "@flint.fyi/core";
import { addFlintAssertionContext, pathKey } from "@flint.fyi/utils";

import { loadConfigDefinition } from "./loadConfigDefinition.ts";
import type { OptionsValues } from "./options.ts";
import { renderCliResults } from "./renderCliResults.ts";
import type { Renderer } from "./renderers/types.ts";

const log = debugForFile(import.meta.url);

export async function runCliWatch(
	host: LinterHost,
	configFileName: string,
	getRenderer: () => Renderer,
	values: OptionsValues,
	args: string[],
): Promise<void> {
	const cwd = host.getCurrentDirectory();
	const isCaseSensitiveFS = host.isCaseSensitiveFS();
	const lintOptions = {
		skipLanguageReports: values["skip-language-reports"] ?? false,
	};

	return new Promise<void>((resolve) => {
		let configDefinition: ProcessedConfigDefinition | undefined;
		let currentRenderer: Renderer | undefined;
		let currentTask: Promise<unknown> = Promise.resolve();
		let importVersion = 0;
		let lintSession: LintSession | undefined;
		let quitting = false;

		const knownUnrelatedFilePaths = new Set<string>();
		const pendingChanges = new Map<string, string>();
		const dependencyWatchers = new Map<string, Disposable>();

		function finish() {
			if (quitting) {
				return;
			}

			quitting = true;
			processPendingChanges.clear();
			pendingChanges.clear();
			watcher[Symbol.dispose]();
			for (const watcher of dependencyWatchers.values()) {
				watcher[Symbol.dispose]();
			}

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
			currentTask = currentTask.then(task, task).catch((error: unknown) => {
				log("Error during lint run: %o", addFlintAssertionContext(error, args));
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

		async function applyFixes(
			session: LintSession,
			initialResults: LintResults["allFileResults"],
		) {
			const changed = new Set<string>();
			const formatFilePaths = new Set<string>();

			async function runIteration(
				filesResults: LintResults["allFileResults"],
				iteration: number,
			): Promise<void> {
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

				await runIteration(
					await session.lintChangedFiles(new Set(fixedFilePaths), lintOptions),
					iteration + 1,
				);
			}

			await runIteration(initialResults, 0);

			return { changed, formatFilePaths };
		}

		async function run({
			filePaths,
			ignoreCache = false,
			rebuild,
		}: {
			filePaths?: Set<string>;
			ignoreCache?: boolean;
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
			const cacheLocation =
				values["cache-location"] || configDefinition.cacheLocation;
			const { changed, formatFilePaths } = await applyFixes(
				lintSession,
				filePaths
					? await lintSession.lintChangedFiles(filePaths, lintOptions)
					: (
							await lintSessionWithCache(lintSession, configFileName, host, {
								cacheLocation,
								ignoreCache,
								...lintOptions,
							})
						).allFileResults,
			);
			const lintResults = { ...lintSession.getResults(), changed };
			const dependencies = new Set<string>();
			for (const result of lintResults.allFileResults.values()) {
				for (const dependency of [
					...result.dependencies,
					...(result.structuralDependencies ?? []),
				]) {
					dependencies.add(dependency);
				}
			}
			for (const [dependency, watcher] of dependencyWatchers) {
				if (!dependencies.has(dependency)) {
					watcher[Symbol.dispose]();
					dependencyWatchers.delete(dependency);
				}
			}
			for (const dependency of dependencies) {
				if (!dependencyWatchers.has(dependency)) {
					dependencyWatchers.set(
						dependency,
						host.watchFileSync(
							dependency,
							() => {
								pendingChanges.set(dependency, dependency);
								processPendingChanges();
							},
							{ ignoredPaths: [] },
						),
					);
				}
			}

			await writeToCache(host, configFileName, lintResults, cacheLocation);

			if (currentRenderer !== renderer) {
				return lintSession;
			}

			await renderCliResults(host, lintResults, renderer, values, {
				formatFilePaths,
				ignoreCache,
				startTime,
			});

			return lintSession;
		}

		async function processChanges(changedFilePaths: string[]) {
			if (
				changedFilePaths.some(
					(filePath) =>
						pathKey(filePath, isCaseSensitiveFS) ===
							pathKey(path.resolve(cwd, configFileName), isCaseSensitiveFS) ||
						lintSession?.hasStructuralDependency(filePath),
				)
			) {
				log("Rebuilding watch session after a structural file change.");
				await run({ ignoreCache: true, rebuild: true });
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
		queueTask(() =>
			run({ ignoreCache: values["cache-ignore"] ?? false, rebuild: true }),
		);
	});
}

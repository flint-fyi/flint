import path from "node:path";

import debounce from "debounce";
import { debugForFile } from "debug-for-file";

import {
	createRelayFileSystemWatcher,
	LintSession,
	nodeModulesCache,
	vcsDirectories,
	withFileSystemWatcher,
	type LinterHost,
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

	const ignoredPaths = [nodeModulesCache, ...vcsDirectories];
	const sessionWatcher = createRelayFileSystemWatcher(host, {
		directoryPath: cwd,
		ignoredPaths,
	});
	const sessionHost = withFileSystemWatcher(host, sessionWatcher);

	return new Promise<void>((resolve) => {
		let currentRenderer: Renderer | undefined;
		let currentTask: Promise<unknown> = Promise.resolve();
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
			currentTask = currentTask.then(task, task).catch((error: unknown) => {
				log("Error during lint run: %o", addFlintAssertionContext(error, args));
			});
		}

		async function rebuildSession(ignoreCache: boolean) {
			currentRenderer?.dispose?.();
			currentRenderer = undefined;
			lintSession?.[Symbol.dispose]();
			lintSession = undefined;
			knownUnrelatedFilePaths.clear();

			const configDefinition = await loadConfigDefinition(
				host,
				configFileName,
				importVersion++,
			);
			if (configDefinition === undefined) {
				return;
			}

			lintSession = await LintSession.create(configDefinition, sessionHost, {
				cacheLocation: values["cache-location"],
				ignoreCache,
			});
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
				await rebuildSession(ignoreCache);
			}
			if (lintSession == null) {
				return;
			}

			const renderer = createRenderer();
			renderer.announce();

			const startTime = performance.now();
			const initialResults = filePaths
				? await lintSession.lintChangedFiles(filePaths, lintOptions)
				: (await lintSession.lint(lintOptions)).allFileResults;
			const { changed, lintedFilePaths: formatFilePaths } = values.fix
				? await lintSession.fixFiles(initialResults, {
						...lintOptions,
						requestedSuggestions: new Set(values["fix-suggestions"]),
					})
				: {
						changed: new Set<string>(),
						lintedFilePaths: new Set(initialResults.keys()),
					};
			const lintResults = { ...lintSession.getResults(), changed };

			await lintSession.writeCache();

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
				sessionWatcher.notifyChange(filePath);
				const normalizedPath = pathKey(filePath, isCaseSensitiveFS);
				pendingChanges.set(normalizedPath, filePath);
				processPendingChanges();
			},
			{ ignoredPaths, recursive: true },
		);

		log("Running initial watch lint.");
		queueTask(() =>
			run({ ignoreCache: values["cache-ignore"] ?? false, rebuild: true }),
		);
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

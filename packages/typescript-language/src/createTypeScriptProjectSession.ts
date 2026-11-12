import path from "pathe";
import {
	API,
	type ParsedCommandLine,
	type Project,
	type Snapshot,
} from "typescript-native/sync";

import type { LinterHost } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

import {
	getTypeScriptContentMapperRegistrations,
	type TypeScriptContentMapperRegistration,
} from "./contentMappers.ts";
import type { BatchRequests } from "./createCachedChecker.ts";
import { createTypeScriptFileSystem } from "./createTypeScriptFileSystem.ts";
import { createTypeScriptOverlayConfig } from "./createTypeScriptOverlayConfig.ts";
import { createVirtualFiles } from "./createVirtualFiles.ts";
import { findNearestConfigFile } from "./findNearestConfigFile.ts";
import { createDefaultProjectResolver } from "./resolveDefaultProjectForFile.ts";
import { isUnderDirectory } from "./utils/isUnderDirectory.ts";

export interface TypeScriptProjectChanges {
	changed?: string[];
	closeFiles?: string[];
	openFiles?: string[];
	openProjects?: string[];
}

export interface TypeScriptProjectSession extends Disposable {
	batch: BatchRequests;
	getProjectForFile(filePath: string): Project | undefined;
	getSnapshot(): Snapshot;
	update(changes: TypeScriptProjectChanges): Snapshot;
}

export interface TypeScriptProjectSessionOptions {
	/**
	 * Whether TypeScript may run the code that configs name, such as content
	 * mappers. Like `tsc --runExternalCode`, it is off unless asked for:
	 * by default, only once a Flint plugin has registered a content mapper.
	 */
	runExternalCode?: boolean;
}

interface SnapshotChanges {
	closeFiles?: string[];
	closeProjects?: string[];
	fileNotifications?: {
		changed?: string[];
		created?: string[];
		deleted?: string[];
	};
	openFiles?: string[];
	openProjects?: string[];
}

export function createTypeScriptProjectSession(
	host: LinterHost,
	{
		runExternalCode = !!getTypeScriptContentMapperRegistrations().length,
	}: TypeScriptProjectSessionOptions = {},
): TypeScriptProjectSession {
	// Tracks the last-seen modification time of every real file the TypeScript
	// file system has touched. Change detection compares these timestamps rather
	// than re-reading full file contents, which keeps a lint pass linear in the
	// number of files instead of O(files opened * files in program) disk reads.
	// Virtual files (config overlays and parse temporaries) are managed here
	// explicitly, so they are never disk-detected.
	const observedTouchTimeByFilePath = new Map<string, number | undefined>();
	let mappedExtensions = new Set<string>();
	const openedMappedFilePaths = new Set<string>();
	const openedOverlayPaths = new Set<string>();
	const overlayPathByAuthoredConfigPath = new Map<string, string>();
	const virtualFiles = createVirtualFiles();
	const loadedExcludingConfigPaths = new Set<string>();
	// Memoizes nearest configs and parsed configs for a single update cycle so
	// resolving a file's owning project does not repeat the same directory
	// walks and config parses for every file.
	let includedFilePathsCache = new Map<string, Set<string>>();
	let nearestConfigCache = new Map<string, string | undefined>();
	let parsedConfigCache = new Map<string, ParsedCommandLine | undefined>();
	const api = new API({
		cwd: host.getCurrentDirectory(),
		fs: createTypeScriptFileSystem(
			host,
			(fileName) => {
				if (virtualFiles.has(fileName)) {
					return;
				}
				observedTouchTimeByFilePath.set(
					fileName,
					host.getFileTouchTimeSync(fileName),
				);
			},
			virtualFiles,
			{ diskBacked: !!host.isDiskBacked },
		),
		runExternalCode,
	});
	const resolveDefaultProject = createDefaultProjectResolver((fileName) =>
		api.getCanonicalFileName(fileName),
	);
	let snapshot: Snapshot;
	try {
		snapshot = api.createSnapshot({});
	} catch (error) {
		api.close();
		throw error;
	}
	let disposed = false;
	const assertActive = (): void => {
		if (disposed) {
			throw new Error("TypeScript project session has been disposed.");
		}
	};
	const replaceSnapshot = (changes: SnapshotChanges): Snapshot => {
		const previousSnapshot = snapshot;
		// Without ensurePrograms, a project whose files changed keeps answering
		// from its previous program.
		snapshot = previousSnapshot.update({ ...changes, ensurePrograms: true });
		// An update that changes nothing answers with the snapshot it was given.
		if (snapshot !== previousSnapshot) {
			previousSnapshot.dispose();
		}
		return snapshot;
	};
	const updateOverlay = (
		authoredConfigFilePath: string,
		registrations: TypeScriptContentMapperRegistration[],
		mappedFilePaths: string[],
	): string => {
		const { config, error } = api.readConfigFile(authoredConfigFilePath);
		if (error) {
			throw new Error(
				`Could not parse TypeScript config: ${authoredConfigFilePath}`,
			);
		}
		const overlay = createTypeScriptOverlayConfig(
			authoredConfigFilePath,
			config,
			registrations,
			[
				...nullThrows(
					parseConfigSafely(authoredConfigFilePath),
					`Could not parse TypeScript config: ${authoredConfigFilePath}`,
				).fileNames,
				...mappedFilePaths,
			],
		);
		virtualFiles.set(overlay.filePath, overlay.sourceText);
		overlayPathByAuthoredConfigPath.set(
			authoredConfigFilePath,
			overlay.filePath,
		);
		return overlay.filePath;
	};
	const findNearestConfig = (filePath: string): string | undefined =>
		findNearestConfigFile(host, filePath, nearestConfigCache);
	const parseConfigSafely = (
		configFilePath: string,
	): ParsedCommandLine | undefined => {
		if (parsedConfigCache.has(configFilePath)) {
			return parsedConfigCache.get(configFilePath);
		}
		let parsed: ParsedCommandLine | undefined;
		try {
			parsed = api.parseConfigFile(configFilePath);
		} catch {
			parsed = undefined;
		}
		parsedConfigCache.set(configFilePath, parsed);
		return parsed;
	};
	const isIncludedByConfig = (
		configFilePath: string,
		filePath: string,
	): boolean => {
		let includedFilePaths = includedFilePathsCache.get(configFilePath);
		if (!includedFilePaths) {
			includedFilePaths = new Set(parseConfigSafely(configFilePath)?.fileNames);
			includedFilePathsCache.set(configFilePath, includedFilePaths);
		}
		return includedFilePaths.has(filePath);
	};
	const countFilesUnder = (
		fileNames: readonly string[],
		directory: string,
	): number => {
		let count = 0;
		for (const fileName of fileNames) {
			if (isUnderDirectory(directory, path.dirname(fileName))) {
				count += 1;
			}
		}
		return count;
	};
	const resolveReferencedConfigPath = (
		referencePath: string,
	): string | undefined => {
		if (host.fileTypeSync(referencePath) === "file") {
			return referencePath;
		}
		const asDirectoryConfig = path.join(referencePath, "tsconfig.json");
		return host.fileTypeSync(asDirectoryConfig) === "file"
			? asDirectoryConfig
			: undefined;
	};
	// A solution-style config (a root `tsconfig.json` that only lists
	// `references` and compiles no files itself) would leave a mapped file with
	// no compiler options if used directly. Redirect to the referenced project
	// whose source tree actually contains the file so it inherits the real
	// strict/jsx/paths settings.
	const resolveConfigForMappedFile = (
		configFilePath: string,
		targetDirectory: string,
		seen: Set<string>,
	): string => {
		if (seen.has(configFilePath)) {
			return configFilePath;
		}
		seen.add(configFilePath);

		const parsed = parseConfigSafely(configFilePath);
		if (!parsed) {
			return configFilePath;
		}
		const references = parsed.projectReferences;
		if (
			!references?.length ||
			countFilesUnder(parsed.fileNames, targetDirectory)
		) {
			// Not a solution config, or it already compiles files under the target.
			return configFilePath;
		}

		let best: undefined | { configFilePath: string; score: number };
		let fallback: string | undefined;
		for (const reference of references) {
			const referencedConfigPath = resolveReferencedConfigPath(reference.path);
			if (!referencedConfigPath) {
				continue;
			}
			const resolved = resolveConfigForMappedFile(
				referencedConfigPath,
				targetDirectory,
				seen,
			);
			const resolvedParsed = parseConfigSafely(resolved);
			if (!resolvedParsed) {
				continue;
			}
			const score = countFilesUnder(resolvedParsed.fileNames, targetDirectory);
			if (score && (!best || score > best.score)) {
				best = { configFilePath: resolved, score };
			}
			fallback ??= resolved;
		}

		return best?.configFilePath ?? fallback ?? configFilePath;
	};
	const findConfigFile = (filePath: string): string | undefined => {
		const nearest = findNearestConfig(filePath);
		if (!nearest) {
			return undefined;
		}
		return resolveConfigForMappedFile(
			nearest,
			path.dirname(filePath),
			new Set(),
		);
	};

	return {
		batch(generators) {
			assertActive();
			return api.batch(...generators);
		},
		getProjectForFile(filePath) {
			assertActive();
			const mapped = mappedExtensions.has(path.extname(filePath));
			if (!mapped && !overlayPathByAuthoredConfigPath.size) {
				return resolveDefaultProject(snapshot, filePath);
			}
			const configFilePath = findConfigFile(filePath);
			const overlayPath =
				configFilePath && overlayPathByAuthoredConfigPath.get(configFilePath);
			const overlayProject =
				overlayPath && snapshot.getConfiguredProject(overlayPath);
			if (mapped) {
				return overlayProject || undefined;
			}
			// The overlay lists every file its authored config includes, re-globbed
			// on each update, so it is the project that reliably contains a file
			// created since the native session first loaded that config. Default
			// project lookup can race that reload and answer with the inferred
			// project instead.
			return overlayProject && overlayProject.program.getSourceFile(filePath)
				? overlayProject
				: resolveDefaultProject(snapshot, filePath);
		},
		getSnapshot() {
			assertActive();
			return snapshot;
		},
		[Symbol.dispose]() {
			if (disposed) {
				return;
			}
			disposed = true;
			api.close();
		},
		update({ changed, closeFiles, openFiles, openProjects }) {
			assertActive();
			// Configs may have changed on disk since the last update, so drop the
			// per-cycle caches used for project resolution.
			includedFilePathsCache = new Map();
			nearestConfigCache = new Map();
			parsedConfigCache = new Map();
			const detectedChanged: string[] = [];
			const detectedCreated: string[] = [];
			const detectedDeleted: string[] = [];
			for (const [filePath, previousTouchTime] of observedTouchTimeByFilePath) {
				const touchTime = host.getFileTouchTimeSync(filePath);
				if (touchTime === previousTouchTime) {
					continue;
				}
				observedTouchTimeByFilePath.set(filePath, touchTime);
				if (previousTouchTime === undefined) {
					detectedCreated.push(filePath);
				} else if (touchTime === undefined) {
					detectedDeleted.push(filePath);
				} else {
					detectedChanged.push(filePath);
				}
			}
			// Callers flag a file they open as changed without knowing whether the
			// native session has seen it. A file it has never touched is new to it,
			// and must be reported as created so that projects whose file sets come
			// from include globs re-scan their directories and pick it up.
			const changedFilePaths = new Set(detectedChanged);
			const createdFilePaths = new Set(detectedCreated);
			for (const filePath of changed ?? []) {
				if (observedTouchTimeByFilePath.has(filePath)) {
					changedFilePaths.add(filePath);
				} else {
					createdFilePaths.add(filePath);
				}
			}
			const registrations = getTypeScriptContentMapperRegistrations();
			mappedExtensions = new Set(
				registrations.flatMap((registration) => registration.extensions),
			);
			// Callers re-open every file they have opened before, including ones
			// that have since been deleted. Opening a missing file would make it a
			// missing root of its overlay, reported as an error on every other file.
			const existingOpenFiles = openFiles?.filter(
				(filePath) => host.fileTypeSync(filePath) === "file",
			);
			const nextOpenedMappedFilePaths = new Set(openedMappedFilePaths);
			for (const filePath of closeFiles ?? []) {
				nextOpenedMappedFilePaths.delete(filePath);
			}
			for (const filePath of existingOpenFiles ?? []) {
				if (mappedExtensions.has(path.extname(filePath))) {
					nextOpenedMappedFilePaths.add(filePath);
				}
			}
			// TypeScript only finds an opened file's project through the nearest
			// tsconfig.json or jsconfig.json, which never lists mapped files. They
			// are instead roots of their overlay project, which is opened directly.
			const isNativeFile = (filePath: string): boolean =>
				!mappedExtensions.has(path.extname(filePath));
			const nativeCloseFiles = closeFiles?.filter(isNativeFile);
			const nativeOpenFiles = existingOpenFiles?.filter(isNativeFile);
			const mappedFilePathsByConfigFilePath = new Map<string, string[]>();
			for (const filePath of nextOpenedMappedFilePaths) {
				const configFilePath = findConfigFile(filePath);
				if (!configFilePath) {
					continue;
				}
				const mappedFilePaths =
					mappedFilePathsByConfigFilePath.get(configFilePath) ?? [];
				mappedFilePaths.push(filePath);
				mappedFilePathsByConfigFilePath.set(configFilePath, mappedFilePaths);
			}
			const mappedConfigFilePaths = [...mappedFilePathsByConfigFilePath.keys()];
			const closeProjects: string[] = [];
			const overlaysToMarkOpened = new Set<string>();
			const previousOverlaySourceTextByPath = new Map<
				string,
				string | undefined
			>();
			const rollbackOverlaySourceTexts = (): void => {
				for (const [
					overlayPath,
					previousSourceText,
				] of previousOverlaySourceTextByPath) {
					if (previousSourceText === undefined) {
						virtualFiles.delete(overlayPath);
					} else {
						virtualFiles.set(overlayPath, previousSourceText);
					}
				}
			};
			let projectsToOpen = openProjects;
			if (registrations.length) {
				projectsToOpen = [];
				try {
					for (const configFilePath of new Set([
						...(openProjects ?? []),
						...mappedConfigFilePaths,
						...overlayPathByAuthoredConfigPath.keys(),
					])) {
						const previousOverlayPath =
							overlayPathByAuthoredConfigPath.get(configFilePath);
						const previousSourceText = previousOverlayPath
							? virtualFiles.get(previousOverlayPath)
							: undefined;
						const overlayPath = updateOverlay(
							configFilePath,
							registrations,
							mappedFilePathsByConfigFilePath.get(configFilePath) ?? [],
						);
						if (!previousOverlaySourceTextByPath.has(overlayPath)) {
							previousOverlaySourceTextByPath.set(
								overlayPath,
								previousSourceText,
							);
						}
						const overlayChanged =
							previousSourceText !== undefined &&
							previousSourceText !== virtualFiles.get(overlayPath);
						if (!openedOverlayPaths.has(overlayPath) || overlayChanged) {
							projectsToOpen.push(overlayPath);
							overlaysToMarkOpened.add(overlayPath);
						}
						if (overlayChanged) {
							changedFilePaths.add(overlayPath);
							closeProjects.push(overlayPath);
						}
					}
				} catch (error) {
					rollbackOverlaySourceTexts();
					throw error;
				}
			}
			if (closeProjects.length) {
				try {
					replaceSnapshot({
						closeProjects,
						fileNotifications: {
							...(changedFilePaths.size && {
								changed: [...changedFilePaths],
							}),
						},
					});
				} catch (error) {
					rollbackOverlaySourceTexts();
					throw error;
				}
				for (const closedOverlayPath of closeProjects) {
					openedOverlayPaths.delete(closedOverlayPath);
				}
			}
			// TypeScript's native process exits when it opens a file whose nearest
			// config it has not loaded and that config sends it looking elsewhere
			// for the file's project: a solution-style config, a composite config,
			// or a config that includes no files. Loading the config first avoids
			// that lookup. Configs that include the file are left for TypeScript
			// to load, as it reloads those once their last open file is closed.
			const configPathsToLoad = new Set<string>();
			for (const filePath of nativeOpenFiles ?? []) {
				const configPath = findNearestConfig(filePath);
				if (
					configPath &&
					!loadedExcludingConfigPaths.has(configPath) &&
					!isIncludedByConfig(configPath, filePath)
				) {
					configPathsToLoad.add(configPath);
				}
			}
			if (configPathsToLoad.size) {
				replaceSnapshot({ openProjects: [...configPathsToLoad] });
				for (const configPath of configPathsToLoad) {
					loadedExcludingConfigPaths.add(configPath);
				}
			}
			const replacement = replaceSnapshot({
				fileNotifications: {
					...(changedFilePaths.size && {
						changed: [...changedFilePaths],
					}),
					...(createdFilePaths.size && {
						created: [...createdFilePaths],
					}),
					...(detectedDeleted.length && { deleted: detectedDeleted }),
				},
				...(nativeCloseFiles?.length && { closeFiles: nativeCloseFiles }),
				...(nativeOpenFiles?.length && { openFiles: nativeOpenFiles }),
				...(projectsToOpen?.length && {
					openProjects: [...new Set(projectsToOpen)],
				}),
			});
			for (const overlayPath of overlaysToMarkOpened) {
				openedOverlayPaths.add(overlayPath);
			}
			openedMappedFilePaths.clear();
			for (const filePath of nextOpenedMappedFilePaths) {
				openedMappedFilePaths.add(filePath);
			}
			return replacement;
		},
	};
}

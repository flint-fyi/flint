import path from "node:path";

import {
	API,
	type Project,
	type Snapshot,
} from "typescript-native/unstable/sync";

import type { LinterHost } from "@flint.fyi/core";

import {
	getTypeScriptContentMapperRegistrations,
	type TypeScriptContentMapperRegistration,
} from "./contentMappers.ts";
import { createTypeScriptFileSystem } from "./createTypeScriptFileSystem.ts";
import { createTypeScriptOverlayConfig } from "./createTypeScriptOverlayConfig.ts";

export interface TypeScriptProjectChanges {
	changed?: string[];
	closeFiles?: string[];
	created?: string[];
	deleted?: string[];
	openFiles?: string[];
	openProjects?: string[];
}

export interface TypeScriptProjectSession extends Disposable {
	getProjectForFile(filePath: string): Project | undefined;
	getSnapshot(): Snapshot;
	update(changes: TypeScriptProjectChanges): Snapshot;
}

interface SnapshotChanges extends TypeScriptProjectChanges {
	closeProjects?: string[];
	fileChanges?: {
		changed?: string[];
		created?: string[];
		deleted?: string[];
	};
}

export function createTypeScriptProjectSession(
	host: LinterHost,
): TypeScriptProjectSession {
	const observedSourceTextByFilePath = new Map<string, string | undefined>();
	const authoredConfigPaths = new Set<string>();
	const authoredConfigPathsToOpen = new Set<string>();
	let mappedExtensions = new Set<string>();
	const openedMappedFilePaths = new Set<string>();
	const openedOverlayPaths = new Set<string>();
	const overlayPathByAuthoredConfigPath = new Map<string, string>();
	const virtualFiles = new Map<string, string>();
	const api = new API({
		cwd: host.getCurrentDirectory(),
		fs: createTypeScriptFileSystem(
			host,
			(fileName) => {
				observedSourceTextByFilePath.set(
					fileName,
					virtualFiles.get(fileName) ?? host.readFileSync(fileName),
				);
			},
			virtualFiles,
		),
		runExternalCode: true,
	});
	let snapshot: Snapshot;
	try {
		snapshot = api.updateSnapshot();
	} catch (error) {
		try {
			api.close();
		} catch (closeError) {
			throw aggregateCleanupFailures(
				error,
				closeError,
				"TypeScript project session initialization failed to clean up.",
			);
		}
		throw error;
	}
	let disposed = false;
	const assertActive = (): void => {
		if (disposed) {
			throw new Error("TypeScript project session has been disposed.");
		}
	};
	const closeApi = (): undefined | { error: unknown } => {
		try {
			api.close();
		} catch (error) {
			return { error };
		}
	};
	const dispose = (): void => {
		if (disposed) {
			return;
		}

		disposed = true;
		let snapshotDisposalFailed = false;
		let snapshotDisposalError: unknown;
		try {
			snapshot.dispose();
		} catch (error) {
			snapshotDisposalFailed = true;
			snapshotDisposalError = error;
		}
		const closeFailure = closeApi();
		if (snapshotDisposalFailed && closeFailure) {
			throw new AggregateError(
				[snapshotDisposalError, closeFailure.error],
				"TypeScript project session failed to dispose.",
				{ cause: snapshotDisposalError },
			);
		}
		if (snapshotDisposalFailed) {
			throw snapshotDisposalError;
		}
		if (closeFailure) {
			throw closeFailure.error;
		}
	};
	const disposeForFailure = (): undefined | { error: unknown } => {
		try {
			dispose();
		} catch (error) {
			return { error };
		}
	};
	const replaceSnapshot = (changes: SnapshotChanges): Snapshot => {
		const previousSnapshot = snapshot;
		snapshot = api.updateSnapshot(changes);
		try {
			previousSnapshot.dispose();
		} catch (error) {
			const disposalFailure = disposeForFailure();
			if (disposalFailure) {
				throw aggregateCleanupFailures(
					error,
					disposalFailure.error,
					"TypeScript project session failed to dispose replaced snapshots.",
				);
			}
			throw error;
		}
		return snapshot;
	};
	const updateOverlay = (
		authoredConfigFilePath: string,
		registrations: TypeScriptContentMapperRegistration[],
		mappedFilePaths: string[],
	): string => {
		const authoredSourceText = host.readFileSync(authoredConfigFilePath);
		if (authoredSourceText === undefined) {
			throw new Error(
				`Could not read TypeScript config: ${authoredConfigFilePath}`,
			);
		}
		const parseFilePath = `${authoredConfigFilePath}.flint-parse.json`;
		virtualFiles.set(parseFilePath, authoredSourceText);
		let config: unknown;
		let error: unknown;
		try {
			({ config, error } = api.readConfigFile(parseFilePath));
		} finally {
			virtualFiles.delete(parseFilePath);
			observedSourceTextByFilePath.delete(parseFilePath);
		}
		if (error) {
			throw new Error(
				`Could not parse TypeScript config: ${authoredConfigFilePath}`,
			);
		}
		const overlay = createTypeScriptOverlayConfig(
			host.getCurrentDirectory(),
			authoredConfigFilePath,
			config,
			registrations,
			[
				...api.parseConfigFile(authoredConfigFilePath).fileNames,
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
	const findConfigFile = (filePath: string): string | undefined => {
		let directory = path.dirname(filePath);
		while (true) {
			for (const configName of ["tsconfig.json", "jsconfig.json"]) {
				const configFilePath = path.join(directory, configName);
				if (host.fileTypeSync(configFilePath) === "file") {
					return configFilePath;
				}
			}
			const parent = path.dirname(directory);
			if (parent === directory) {
				return undefined;
			}
			directory = parent;
		}
	};

	return {
		getProjectForFile(filePath) {
			assertActive();
			if (!mappedExtensions.has(path.extname(filePath))) {
				return snapshot.getDefaultProjectForFile(filePath);
			}
			const configFilePath = findConfigFile(filePath);
			if (!configFilePath) {
				return undefined;
			}
			const overlayPath = overlayPathByAuthoredConfigPath.get(configFilePath);
			return overlayPath ? snapshot.getProject(overlayPath) : undefined;
		},
		getSnapshot() {
			assertActive();
			return snapshot;
		},
		[Symbol.dispose]: dispose,
		update({ changed, closeFiles, created, deleted, openFiles, openProjects }) {
			assertActive();
			const detectedChanged: string[] = [];
			const detectedCreated: string[] = [];
			const detectedDeleted: string[] = [];
			for (const [
				filePath,
				previousSourceText,
			] of observedSourceTextByFilePath) {
				const sourceText =
					virtualFiles.get(filePath) ?? host.readFileSync(filePath);
				if (sourceText === previousSourceText) {
					continue;
				}
				if (previousSourceText === undefined) {
					detectedCreated.push(filePath);
				} else if (sourceText === undefined) {
					detectedDeleted.push(filePath);
				} else {
					detectedChanged.push(filePath);
				}
			}
			const changedFilePaths = new Set([
				...(changed ?? []),
				...detectedChanged,
			]);
			const registrations = getTypeScriptContentMapperRegistrations();
			mappedExtensions = new Set(
				registrations.flatMap((registration) => registration.extensions),
			);
			const nextOpenedMappedFilePaths = new Set(openedMappedFilePaths);
			for (const filePath of closeFiles ?? []) {
				nextOpenedMappedFilePaths.delete(filePath);
			}
			for (const filePath of openFiles ?? []) {
				if (mappedExtensions.has(path.extname(filePath))) {
					nextOpenedMappedFilePaths.add(filePath);
				}
			}
			const mappedConfigFilePaths = [...nextOpenedMappedFilePaths]
				.filter((filePath) => mappedExtensions.has(path.extname(filePath)))
				.map(findConfigFile)
				.filter((configFilePath): configFilePath is string => !!configFilePath);
			const mappedFilePathsByConfigFilePath = new Map<string, string[]>();
			for (const filePath of nextOpenedMappedFilePaths) {
				if (!mappedExtensions.has(path.extname(filePath))) {
					continue;
				}
				const configFilePath = findConfigFile(filePath);
				if (!configFilePath) {
					continue;
				}
				const mappedFilePaths =
					mappedFilePathsByConfigFilePath.get(configFilePath) ?? [];
				mappedFilePaths.push(filePath);
				mappedFilePathsByConfigFilePath.set(configFilePath, mappedFilePaths);
			}
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
					if (previousSourceText !== undefined) {
						virtualFiles.set(overlayPath, previousSourceText);
					} else {
						virtualFiles.delete(overlayPath);
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
			} else if (openedOverlayPaths.size || authoredConfigPathsToOpen.size) {
				closeProjects.push(...openedOverlayPaths);
				projectsToOpen = [
					...(openProjects ?? []),
					...authoredConfigPaths,
					...authoredConfigPathsToOpen,
				];
			}
			if (closeProjects.length) {
				try {
					replaceSnapshot({
						closeProjects,
						fileChanges: {
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
				if (!registrations.length) {
					authoredConfigPathsToOpen.clear();
					for (const authoredConfigPath of authoredConfigPaths) {
						authoredConfigPathsToOpen.add(authoredConfigPath);
					}
				}
			}
			const replacement = replaceSnapshot({
				fileChanges: {
					...(changedFilePaths.size && {
						changed: [...changedFilePaths],
					}),
					...((created ?? detectedCreated.length) && {
						created: [...new Set([...(created ?? []), ...detectedCreated])],
					}),
					...((deleted ?? detectedDeleted.length) && {
						deleted: [...new Set([...(deleted ?? []), ...detectedDeleted])],
					}),
				},
				...(closeFiles && { closeFiles }),
				...(openFiles && { openFiles }),
				...(projectsToOpen?.length && {
					openProjects: [...new Set(projectsToOpen)],
				}),
			});
			for (const authoredConfigPath of openProjects ?? []) {
				authoredConfigPaths.add(authoredConfigPath);
				authoredConfigPathsToOpen.delete(authoredConfigPath);
			}
			if (!registrations.length) {
				authoredConfigPathsToOpen.clear();
			}
			for (const authoredConfigPath of mappedConfigFilePaths) {
				authoredConfigPaths.add(authoredConfigPath);
			}
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

function aggregateCleanupFailures(
	initialError: unknown,
	cleanupError: unknown,
	message: string,
): AggregateError {
	const cleanupErrors: unknown[] =
		cleanupError instanceof AggregateError
			? Array.from<unknown>(cleanupError.errors)
			: [cleanupError];
	return new AggregateError([initialError, ...cleanupErrors], message, {
		cause: initialError,
	});
}

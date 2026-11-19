import {
	dirnameKey,
	normalizeDirname,
	normalizePath,
	pathKey,
	type PathKey,
} from "@flint.fyi/utils";

import type {
	FileSystemWatcher,
	LinterHost,
	LinterHostDirectoryWatcher,
	LinterHostFileWatcher,
	LinterHostFileWatcherEvent,
} from "../types/host.ts";
import { isIgnoredRelativePath } from "./watcher.ts";

export interface RelayFileSystemWatcher extends FileSystemWatcher {
	notifyChange(filePathAbsolute: string): void;
}

interface DirectoryWatcher {
	callback: LinterHostDirectoryWatcher;
	directoryPath: string;
	ignoredPaths: string[];
}

interface FileWatchers {
	callbacks: Set<LinterHostFileWatcher>;
	exists: boolean;
	filePath: string;
}

export function createRelayFileSystemWatcher(
	host: LinterHost,
	coverage: { directoryPath: string; ignoredPaths: string[] },
): RelayFileSystemWatcher {
	const caseSensitiveFS = host.isCaseSensitiveFS();
	const coveredPath = normalizePath(coverage.directoryPath);
	const coveredKey = toKey(coveredPath);
	const coveredKeySlash = dirnameKey(coveredPath, caseSensitiveFS);
	const fileWatchers = new Map<PathKey, FileWatchers>();
	const directoryWatchers = new Map<PathKey, Set<DirectoryWatcher>>();
	const recursiveDirectoryWatchers = new Map<PathKey, Set<DirectoryWatcher>>();

	function toKey(path: string): PathKey {
		return pathKey(path, caseSensitiveFS);
	}

	function isCovered(path: string): boolean {
		const key = toKey(path);
		return (
			(key === coveredKey || key.startsWith(coveredKeySlash)) &&
			!isIgnoredRelativePath(
				path.slice(coveredPath.length),
				coverage.ignoredPaths,
			)
		);
	}

	function notifyWatchersOf(key: PathKey): void {
		const watchers = fileWatchers.get(key);
		if (watchers) {
			const exists = host.fileTypeSync(watchers.filePath) !== undefined;
			const event = getFileEvent(watchers.exists, exists);
			watchers.exists = exists;
			if (event) {
				for (const callback of watchers.callbacks) {
					callback(event);
				}
			}
		}

		for (const watchersByKey of [
			directoryWatchers,
			recursiveDirectoryWatchers,
		]) {
			for (const watcher of watchersByKey.get(key) ?? []) {
				watcher.callback(watcher.directoryPath);
			}
		}
	}

	function notifyDirectoryWatchers(
		watchers: Set<DirectoryWatcher> | undefined,
		changedPath: string,
	): void {
		for (const watcher of watchers ?? []) {
			if (
				!isIgnoredRelativePath(
					changedPath.slice(watcher.directoryPath.length),
					watcher.ignoredPaths,
				)
			) {
				watcher.callback(changedPath);
			}
		}
	}

	return {
		notifyChange(filePathAbsolute) {
			const changedPath = normalizePath(filePathAbsolute);

			notifyWatchersOf(toKey(changedPath));

			// Recursive disk watchers report a directory moved in or out as one event,
			// without events for its contents.
			if (host.fileTypeSync(changedPath) !== "file") {
				const descendantKeyPrefix = dirnameKey(changedPath, caseSensitiveFS);
				const descendantKeys = new Set(
					[
						...fileWatchers.keys(),
						...directoryWatchers.keys(),
						...recursiveDirectoryWatchers.keys(),
					].filter((key) => key.startsWith(descendantKeyPrefix)),
				);
				for (const key of descendantKeys) {
					notifyWatchersOf(key);
				}
			}

			let directoryPath = normalizeDirname(changedPath);
			notifyDirectoryWatchers(
				directoryWatchers.get(toKey(directoryPath)),
				changedPath,
			);
			while (true) {
				notifyDirectoryWatchers(
					recursiveDirectoryWatchers.get(toKey(directoryPath)),
					changedPath,
				);
				const parentPath = normalizeDirname(directoryPath);
				if (parentPath === directoryPath) {
					return;
				}
				directoryPath = parentPath;
			}
		},
		watchDirectorySync(directoryPathAbsolute, callback, options) {
			const directoryPath = normalizePath(directoryPathAbsolute);
			if (!isCovered(directoryPath)) {
				return host.watchDirectorySync(directoryPath, callback, options);
			}

			const watchersByKey = options.recursive
				? recursiveDirectoryWatchers
				: directoryWatchers;
			const key = toKey(directoryPath);
			const watchers = watchersByKey.get(key) ?? new Set();
			const watcher = {
				callback,
				directoryPath,
				ignoredPaths: options.ignoredPaths,
			};
			watchersByKey.set(key, watchers);
			watchers.add(watcher);

			return {
				[Symbol.dispose]() {
					if (watchers.delete(watcher) && !watchers.size) {
						watchersByKey.delete(key);
					}
				},
			};
		},
		watchFileSync(filePathAbsolute, callback, options) {
			const filePath = normalizePath(filePathAbsolute);
			if (!isCovered(filePath)) {
				return host.watchFileSync(filePath, callback, options);
			}

			const key = toKey(filePath);
			const watchers = fileWatchers.get(key) ?? {
				callbacks: new Set(),
				exists: host.fileTypeSync(filePath) !== undefined,
				filePath,
			};
			fileWatchers.set(key, watchers);
			watchers.callbacks.add(callback);

			return {
				[Symbol.dispose]() {
					if (watchers.callbacks.delete(callback) && !watchers.callbacks.size) {
						fileWatchers.delete(key);
					}
				},
			};
		},
	};
}

function getFileEvent(
	existed: boolean,
	exists: boolean,
): LinterHostFileWatcherEvent | undefined {
	if (!exists) {
		return existed ? "deleted" : undefined;
	}

	return existed ? "changed" : "created";
}

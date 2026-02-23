import {
	normalizedDirname,
	normalizePath,
	pathKey,
	type PathKey,
} from "@flint.fyi/utils";

import type {
	LinterHost,
	LinterHostDirectoryEntry,
	LinterHostDirectoryWatcher,
	LinterHostFileWatcher,
	LinterHostFileWatcherEvent,
	VFSLinterHost,
} from "../types/host.ts";
import { isFileSystemCaseSensitive } from "./isFileSystemCaseSensitive.ts";

export type CreateVFSLinterHostOpts =
	| {
			baseHost: LinterHost;
			caseSensitive?: never;
			cwd?: string | undefined;
	  }
	| {
			baseHost?: never;
			caseSensitive?: boolean | undefined;
			cwd: string;
	  };

/**
 * Current limitations in watch mode:
 *
 * VFS is not directory-aware:
 *		- In non-recursive watchDirectory, every change to deeply nested children
 *			emits event on the immediate watched directory child.
 *		- created/deleted events are emitted without acknowledging whether
 *			the base host has directories containing the target file path.
 *		- Base host events are not filtered; if you delete a file from the base host,
 *			but not from the VFS, a deleted event will still be emitted.
 *		- You cannot watch directory via watchFile.
 *
 * Other limitations:
 *		- VFS is file-only; empty directories cannot be represented, and directory
 * 			existence is inferred from file paths.
 */
export function createVFSLinterHost(
	opts: CreateVFSLinterHostOpts,
): VFSLinterHost {
	let cwd: string;
	let baseHost: LinterHost | undefined;
	let caseSensitiveFS: boolean;
	if (opts.baseHost == null) {
		caseSensitiveFS = opts.caseSensitive ?? isFileSystemCaseSensitive();
		cwd = normalizePath(opts.cwd);
	} else {
		baseHost = opts.baseHost;
		cwd = opts.cwd ?? baseHost.getCurrentDirectory();
		caseSensitiveFS = baseHost.isCaseSensitiveFS();
	}

	interface VfsFile {
		content: string;
		path: string;
	}

	const fileMap = new Map<PathKey, VfsFile>();
	const fileWatchers = new Map<PathKey, Set<LinterHostFileWatcher>>();
	const directoryWatchers = new Map<PathKey, Set<LinterHostDirectoryWatcher>>();
	const recursiveDirectoryWatchers = new Map<
		PathKey,
		Set<LinterHostDirectoryWatcher>
	>();

	/**
	 * Creates a {@link PathKey} with a trailing slash for directory prefix
	 * matching. {@link pathKey} normalizes internally, which strips trailing
	 * slashes, so we append one after to enable `startsWith` checks against
	 * file keys.
	 */
	function keySlashOf(p: string): PathKey {
		return (pathKey(p, caseSensitiveFS) + "/") as PathKey;
	}

	function watchEvent(
		normalizedFilePathAbsolute: string,
		fileEvent: LinterHostFileWatcherEvent,
	) {
		for (const watcher of fileWatchers.get(
			pathKey(normalizedFilePathAbsolute, caseSensitiveFS),
		) ?? []) {
			watcher(fileEvent);
		}

		let currentFile = normalizedFilePathAbsolute;
		let currentDir = normalizedDirname(currentFile);
		do {
			for (const watcher of directoryWatchers.get(
				pathKey(currentDir, caseSensitiveFS),
			) ?? []) {
				watcher(currentFile);
			}
			currentFile = currentDir;
			currentDir = normalizedDirname(currentFile);
		} while (currentFile !== currentDir);

		let dir = normalizedDirname(normalizedFilePathAbsolute);
		while (true) {
			for (const watcher of recursiveDirectoryWatchers.get(
				pathKey(dir, caseSensitiveFS),
			) ?? []) {
				watcher(normalizedFilePathAbsolute);
			}
			const prevDir = dir;
			dir = normalizedDirname(dir);
			if (prevDir === dir) {
				break;
			}
		}
	}
	return {
		getCurrentDirectory() {
			return cwd;
		},
		isCaseSensitiveFS() {
			return caseSensitiveFS;
		},
		readDirectory(directoryPathAbsolute) {
			const dirNorm = normalizePath(directoryPathAbsolute);
			const dirNormSlash = dirNorm.endsWith("/") ? dirNorm : dirNorm + "/";
			const dirKeySlash = keySlashOf(dirNorm);
			const result = new Map<string, LinterHostDirectoryEntry>();

			for (const [fileKey, file] of fileMap) {
				if (!fileKey.startsWith(dirKeySlash)) {
					continue;
				}
				const relPath = file.path.slice(dirNormSlash.length);
				const slashIndex = relPath.indexOf("/");
				let dirent: LinterHostDirectoryEntry = {
					name: relPath,
					type: "file",
				};
				if (slashIndex >= 0) {
					dirent = {
						name: relPath.slice(0, slashIndex),
						type: "directory",
					};
				}
				const nameKey = caseSensitiveFS
					? dirent.name
					: dirent.name.toLowerCase();
				if (!result.get(nameKey)) {
					result.set(nameKey, dirent);
				}
			}

			return [
				...result.values(),
				...(baseHost?.stat(directoryPathAbsolute) === "directory"
					? baseHost
							.readDirectory(directoryPathAbsolute)
							.filter(
								({ name }) =>
									!result.has(caseSensitiveFS ? name : name.toLowerCase()),
							)
					: []),
			];
		},
		readFile(filePathAbsolute) {
			filePathAbsolute = normalizePath(filePathAbsolute);
			const file = fileMap.get(pathKey(filePathAbsolute, caseSensitiveFS));
			if (file != null) {
				return file.content;
			}
			if (baseHost?.stat(filePathAbsolute) === "file") {
				return baseHost.readFile(filePathAbsolute);
			}
			return undefined;
		},
		stat(pathAbsolute) {
			pathAbsolute = normalizePath(pathAbsolute);
			const key = pathKey(pathAbsolute, caseSensitiveFS);
			const keySlash = keySlashOf(pathAbsolute);
			for (const fileKey of fileMap.keys()) {
				if (key === fileKey) {
					return "file";
				}
				if (fileKey.startsWith(keySlash)) {
					return "directory";
				}
			}
			return baseHost?.stat(pathAbsolute);
		},
		vfsDeleteFile(filePathAbsolute) {
			filePathAbsolute = normalizePath(filePathAbsolute);
			const key = pathKey(filePathAbsolute, caseSensitiveFS);
			const file = fileMap.get(key);
			if (file == null) {
				return;
			}
			fileMap.delete(key);
			watchEvent(file.path, "deleted");
		},
		vfsListFiles() {
			return new Map(Array.from(fileMap.values(), (f) => [f.path, f.content]));
		},
		vfsUpsertFile(filePathAbsolute, content) {
			filePathAbsolute = normalizePath(filePathAbsolute);
			const key = pathKey(filePathAbsolute, caseSensitiveFS);
			const existing = fileMap.get(key);
			const storedPath = existing?.path ?? filePathAbsolute;
			const fileEvent = existing != null ? "changed" : "created";
			fileMap.set(key, { content, path: storedPath });
			watchEvent(storedPath, fileEvent);
		},
		watchDirectory(
			directoryPathAbsolute,
			recursive,
			callback,
			pollingInterval,
		) {
			directoryPathAbsolute = normalizePath(directoryPathAbsolute);
			const key = pathKey(directoryPathAbsolute, caseSensitiveFS);
			const collection = recursive
				? recursiveDirectoryWatchers
				: directoryWatchers;
			let watchers = collection.get(key);
			if (watchers == null) {
				watchers = new Set();
				collection.set(key, watchers);
			}
			watchers.add(callback);
			const baseWatcher = baseHost?.watchDirectory(
				directoryPathAbsolute,
				recursive,
				callback,
				pollingInterval,
			);
			return {
				[Symbol.dispose]() {
					watchers.delete(callback);
					if (!watchers.size) {
						collection.delete(key);
					}
					baseWatcher?.[Symbol.dispose]();
				},
			};
		},
		watchFile(filePathAbsolute, callback, pollingInterval) {
			filePathAbsolute = normalizePath(filePathAbsolute);
			const key = pathKey(filePathAbsolute, caseSensitiveFS);
			let watchers = fileWatchers.get(key);
			if (watchers == null) {
				watchers = new Set();
				fileWatchers.set(key, watchers);
			}
			watchers.add(callback);
			const baseWatcher = baseHost?.watchFile(
				filePathAbsolute,
				callback,
				pollingInterval,
			);
			return {
				[Symbol.dispose]() {
					watchers.delete(callback);
					if (!watchers.size) {
						fileWatchers.delete(key);
					}
					baseWatcher?.[Symbol.dispose]();
				},
			};
		},
	};
}

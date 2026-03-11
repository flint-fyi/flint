import {
	dirnameKey,
	normalizeDirname,
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
		path: PathKey;
	}

	const fileMap = new Map<PathKey, VfsFile>();
	const fileWatchers = new Map<PathKey, Set<LinterHostFileWatcher>>();
	const directoryWatchers = new Map<PathKey, Set<LinterHostDirectoryWatcher>>();
	const recursiveDirectoryWatchers = new Map<
		PathKey,
		Set<LinterHostDirectoryWatcher>
	>();

	function watchEvent(
		normalizedFilePathAbsolute: PathKey,
		fileEvent: LinterHostFileWatcherEvent,
	) {
		for (const watcher of fileWatchers.get(normalizedFilePathAbsolute) ?? []) {
			watcher(fileEvent);
		}

		let currentFile: string = normalizedFilePathAbsolute;
		let currentDir = normalizeDirname(currentFile);
		do {
			for (const watcher of directoryWatchers.get(
				pathKey(currentDir, caseSensitiveFS),
			) ?? []) {
				watcher(currentFile);
			}
			currentFile = currentDir;
			currentDir = normalizeDirname(currentFile);
		} while (currentFile !== currentDir);

		let dir = normalizeDirname(normalizedFilePathAbsolute);
		while (true) {
			for (const watcher of recursiveDirectoryWatchers.get(
				pathKey(dir, caseSensitiveFS),
			) ?? []) {
				watcher(normalizedFilePathAbsolute);
			}
			const prevDir = dir;
			dir = normalizeDirname(dir);
			if (prevDir === dir) {
				break;
			}
		}
	}
	const host: VFSLinterHost = {
		fileTypeSync(pathAbsolute) {
			pathAbsolute = normalizePath(pathAbsolute);
			const key = pathKey(pathAbsolute, caseSensitiveFS);
			const keySlash = dirnameKey(pathAbsolute, caseSensitiveFS);
			for (const fileKey of fileMap.keys()) {
				if (key === fileKey) {
					return "file";
				}
				if (fileKey.startsWith(keySlash)) {
					return "directory";
				}
			}
			return baseHost?.fileTypeSync(pathAbsolute);
		},
		getCurrentDirectory() {
			return cwd;
		},
		// eslint-disable-next-line @typescript-eslint/require-await
		async getFileTouchTime(filePath) {
			return host.getFileTouchTimeSync(filePath);
		},
		getFileTouchTimeSync() {
			// TODO: uhh... this probably doesn't work amazingly
			return Date.now();
		},
		isCaseSensitiveFS() {
			return caseSensitiveFS;
		},
		// eslint-disable-next-line @typescript-eslint/require-await
		async readDirectory(directoryPathAbsolute) {
			return host.readDirectorySync(directoryPathAbsolute);
		},
		readDirectorySync(directoryPathAbsolute) {
			const dirNorm = normalizePath(directoryPathAbsolute);
			const dirNormSlash = dirNorm.endsWith("/") ? dirNorm : dirNorm + "/";
			const dirKeySlash = dirnameKey(dirNorm, caseSensitiveFS);
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
				if (!result.get(dirent.name)) {
					result.set(dirent.name, dirent);
				}
			}

			return [
				...result.values(),
				...(baseHost?.fileTypeSync(directoryPathAbsolute) === "directory"
					? baseHost
							.readDirectorySync(directoryPathAbsolute)
							.filter(
								({ name }) =>
									!result.has(caseSensitiveFS ? name : name.toLowerCase()),
							)
					: []),
			];
		},
		// eslint-disable-next-line @typescript-eslint/require-await
		async readFile(filePathAbsolute) {
			return host.readFileSync(filePathAbsolute);
		},
		readFileSync(filePathAbsolute) {
			filePathAbsolute = normalizePath(filePathAbsolute);
			const file = fileMap.get(pathKey(filePathAbsolute, caseSensitiveFS));
			if (file != null) {
				return file.content;
			}
			if (baseHost?.fileTypeSync(filePathAbsolute) === "file") {
				return baseHost.readFileSync(filePathAbsolute);
			}
			return undefined;
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
			// TODO: Thread PathKey through the rest of the core.
			const storedPath = existing?.path ?? (filePathAbsolute as PathKey);
			const fileEvent = existing != null ? "changed" : "created";
			fileMap.set(key, { content, path: storedPath });
			watchEvent(storedPath, fileEvent);
		},
		watchDirectorySync(directoryPathAbsolute, callback, options) {
			directoryPathAbsolute = normalizePath(directoryPathAbsolute);
			const key = pathKey(directoryPathAbsolute, caseSensitiveFS);
			const collection = options.recursive
				? recursiveDirectoryWatchers
				: directoryWatchers;
			let watchers = collection.get(key);
			if (watchers == null) {
				watchers = new Set();
				collection.set(key, watchers);
			}
			watchers.add(callback);
			const baseWatcher = baseHost?.watchDirectorySync(
				directoryPathAbsolute,
				callback,
				options,
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
		watchFileSync(filePathAbsolute, callback, options) {
			filePathAbsolute = normalizePath(filePathAbsolute);
			const key = pathKey(filePathAbsolute, caseSensitiveFS);
			let watchers = fileWatchers.get(key);

			if (watchers == null) {
				watchers = new Set();
				fileWatchers.set(key, watchers);
			}
			watchers.add(callback);
			const baseWatcher = baseHost?.watchFileSync(
				filePathAbsolute,
				callback,
				options,
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
		// eslint-disable-next-line @typescript-eslint/require-await
		async writeFile(filePathAbsolute, content) {
			host.vfsUpsertFile(filePathAbsolute, content);
		},
		writeFileSync(filePathAbsolute, content) {
			host.vfsUpsertFile(filePathAbsolute, content);
		},
	};

	return host;
}

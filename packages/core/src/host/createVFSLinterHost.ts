import type {
	LinterHost,
	LinterHostDirectoryEntry,
	LinterHostDirectoryWatcher,
	LinterHostFileWatcher,
	LinterHostFileWatcherEvent,
	VFSLinterHost,
} from "../types/host.ts";
import { isFileSystemCaseSensitive } from "./isFileSystemCaseSensitive.ts";
import { normalizedDirname, normalizePath } from "./normalizePath.ts";

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
		cwd = normalizePath(opts.cwd, caseSensitiveFS);
	} else {
		baseHost = opts.baseHost;
		cwd = opts.cwd ?? baseHost.getCurrentDirectory();
		caseSensitiveFS = baseHost.isCaseSensitiveFS();
	}

	const fileMap = new Map<string, string>();
	const fileWatchers = new Map<string, Set<LinterHostFileWatcher>>();
	const directoryWatchers = new Map<string, Set<LinterHostDirectoryWatcher>>();
	const recursiveDirectoryWatchers = new Map<
		string,
		Set<LinterHostDirectoryWatcher>
	>();
	function watchEvent(
		normalizedFilePathAbsolute: string,
		fileEvent: LinterHostFileWatcherEvent,
	) {
		for (const watcher of fileWatchers.get(normalizedFilePathAbsolute) ?? []) {
			watcher(fileEvent);
		}

		let currentFile = normalizedFilePathAbsolute;
		let currentDir = normalizedDirname(currentFile);
		do {
			for (const watcher of directoryWatchers.get(currentDir) ?? []) {
				watcher(currentFile);
			}
			currentFile = currentDir;
			currentDir = normalizedDirname(currentFile);
		} while (currentFile !== currentDir);

		let dir = normalizedDirname(normalizedFilePathAbsolute);
		while (true) {
			for (const watcher of recursiveDirectoryWatchers.get(dir) ?? []) {
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
			directoryPathAbsolute =
				normalizePath(directoryPathAbsolute, caseSensitiveFS) + "/";
			const result = new Map<string, LinterHostDirectoryEntry>();

			for (let filePath of fileMap.keys()) {
				if (!filePath.startsWith(directoryPathAbsolute)) {
					continue;
				}
				filePath = filePath.slice(directoryPathAbsolute.length);
				const slashIndex = filePath.indexOf("/");
				let dirent: LinterHostDirectoryEntry = {
					name: filePath,
					type: "file",
				};
				if (slashIndex >= 0) {
					dirent = {
						name: filePath.slice(0, slashIndex),
						type: "directory",
					};
				}
				if (!result.get(dirent.name)) {
					result.set(dirent.name, dirent);
				}
			}

			return [
				...result.values(),
				...(baseHost?.stat(directoryPathAbsolute) === "directory"
					? baseHost
							.readDirectory(directoryPathAbsolute)
							.filter(({ name }) => !result.has(name))
					: []),
			];
		},
		readFile(filePathAbsolute) {
			filePathAbsolute = normalizePath(filePathAbsolute, caseSensitiveFS);
			const file = fileMap.get(filePathAbsolute);
			if (file != null) {
				return file;
			}
			if (baseHost?.stat(filePathAbsolute) === "file") {
				return baseHost.readFile(filePathAbsolute);
			}
			return undefined;
		},
		stat(pathAbsolute) {
			pathAbsolute = normalizePath(pathAbsolute, caseSensitiveFS);
			for (const filePath of fileMap.keys()) {
				if (pathAbsolute === filePath) {
					return "file";
				}
				if (filePath.startsWith(pathAbsolute + "/")) {
					return "directory";
				}
			}
			return baseHost?.stat(pathAbsolute);
		},
		vfsDeleteFile(filePathAbsolute) {
			filePathAbsolute = normalizePath(filePathAbsolute, caseSensitiveFS);
			if (!fileMap.delete(filePathAbsolute)) {
				return;
			}
			watchEvent(filePathAbsolute, "deleted");
		},
		vfsListFiles() {
			return fileMap;
		},
		vfsUpsertFile(filePathAbsolute, content) {
			filePathAbsolute = normalizePath(filePathAbsolute, caseSensitiveFS);
			const fileEvent = fileMap.has(filePathAbsolute) ? "changed" : "created";
			fileMap.set(filePathAbsolute, content);
			watchEvent(filePathAbsolute, fileEvent);
		},
		watchDirectory(
			directoryPathAbsolute,
			recursive,
			callback,
			pollingInterval,
		) {
			directoryPathAbsolute = normalizePath(
				directoryPathAbsolute,
				caseSensitiveFS,
			);
			const collection = recursive
				? recursiveDirectoryWatchers
				: directoryWatchers;
			let watchers = collection.get(directoryPathAbsolute);
			if (watchers == null) {
				watchers = new Set();
				collection.set(directoryPathAbsolute, watchers);
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
					if (watchers.size === 0) {
						collection.delete(directoryPathAbsolute);
					}
					baseWatcher?.[Symbol.dispose]();
				},
			};
		},
		watchFile(filePathAbsolute, callback, pollingInterval) {
			filePathAbsolute = normalizePath(filePathAbsolute, caseSensitiveFS);
			let watchers = fileWatchers.get(filePathAbsolute);
			if (watchers == null) {
				watchers = new Set();
				fileWatchers.set(filePathAbsolute, watchers);
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
					if (watchers.size === 0) {
						fileWatchers.delete(filePathAbsolute);
					}
					baseWatcher?.[Symbol.dispose]();
				},
			};
		},
	};
}

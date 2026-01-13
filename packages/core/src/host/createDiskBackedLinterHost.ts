import fs from "node:fs";
import path from "node:path";

import type {
	LinterHost,
	LinterHostDirectoryEntry,
	LinterHostFileWatcherEvent,
} from "../types/host.ts";
import { isFileSystemCaseSensitive } from "./isFileSystemCaseSensitive.ts";
import { normalizePath } from "./normalizePath.ts";

const ignoredPaths = ["/node_modules", "/.git", "/.jj"];

export function createDiskBackedLinterHost(cwd: string): LinterHost {
	const caseSensitiveFS = isFileSystemCaseSensitive();
	cwd = normalizePath(cwd, caseSensitiveFS);

	function createWatcher(
		normalizedWatchPath: string,
		recursive: boolean,
		pollingInterval: number,
		callback: (
			normalizedChangedFilePath: null | string,
			event: LinterHostFileWatcherEvent,
		) => void,
	): Disposable {
		const normalizedWatchBasename = normalizedWatchPath.slice(
			normalizedWatchPath.lastIndexOf("/") + 1,
		);
		let exists = fs.existsSync(normalizedWatchPath);
		let unwatch: () => void = exists ? watchPresent() : watchMissing();

		function statAndEmitIfChanged(
			changedFileName: null | string,
			existsNow: boolean | null = null,
		) {
			if (changedFileName != null) {
				changedFileName = normalizePath(changedFileName, caseSensitiveFS);
			}
			existsNow ??= fs.existsSync(normalizedWatchPath);
			if (existsNow) {
				callback(changedFileName, exists ? "changed" : "created");
			} else {
				callback(changedFileName, "deleted");
			}
			exists = existsNow;
			return exists;
		}

		// fs.watch is more performant than fs.watchFile,
		// we use it when file exists on disk
		function watchPresent() {
			const watcher = fs
				.watch(
					normalizedWatchPath,
					{ persistent: false, recursive },
					(event, filename) => {
						if (unwatched) {
							return;
						}
						// C:/foo is a directory
						// fs.watch('C:/foo')
						// C:/foo deleted
						// fs.watch emits \\?\C:\foo
						// See https://learn.microsoft.com/en-us/dotnet/standard/io/file-path-formats
						if (filename?.startsWith("\\\\?\\")) {
							filename = filename.slice("\\\\?\\".length);
						}
						if (filename === normalizedWatchBasename) {
							let changedPath = normalizedWatchPath;
							// /foo/bar is a directory
							// /foo/bar/bar is a file
							// fs.watch('/foo/bar')
							// /foo/bar/bar deleted -> filename === bar
							// /foo/bar deleted -> filename === bar
							if (
								fs
									.statSync(normalizedWatchPath, { throwIfNoEntry: false })
									?.isDirectory()
							) {
								changedPath = normalizePath(
									path.resolve(normalizedWatchPath, filename),
									caseSensitiveFS,
								);
							}
							if (statAndEmitIfChanged(changedPath)) {
								return;
							}
						}
						if (!fs.existsSync(normalizedWatchPath)) {
							statAndEmitIfChanged(normalizedWatchPath, false);
						} else if (
							statAndEmitIfChanged(
								filename == null
									? null
									: normalizePath(
											path.resolve(normalizedWatchPath, filename),
											caseSensitiveFS,
										),
							)
						) {
							return;
						}
						unwatchSelf();
						unwatch = watchMissing();
					},
				)
				.on("error", () => {
					// parent dir deleted
					if (unwatched) {
						return;
					}
					unwatchSelf();
					unwatch = watchMissing();
				});
			let unwatched = false;
			const unwatchSelf = () => {
				unwatched = true;
				watcher.close();
			};
			return unwatchSelf;
		}

		// fs.watchFile uses polling and therefore is less performant,
		// we fallback to it when the file doesn't exist on disk
		function watchMissing() {
			const listener: fs.StatsListener = (curr, prev) => {
				if (unwatched) {
					return;
				}
				if (curr.mtimeMs === prev.mtimeMs || curr.mtimeMs === 0) {
					return;
				}
				if (!statAndEmitIfChanged(normalizedWatchPath)) {
					return;
				}
				fs.unwatchFile(normalizedWatchPath, listener);
				unwatchSelf();
				unwatch = watchPresent();
			};
			fs.watchFile(
				normalizedWatchPath,
				{ interval: pollingInterval, persistent: false },
				listener,
			);
			let unwatched = false;
			const unwatchSelf = () => {
				unwatched = true;
				fs.unwatchFile(normalizedWatchPath, listener);
			};
			return unwatchSelf;
		}
		return {
			[Symbol.dispose]() {
				unwatch();
			},
		};
	}

	return {
		getCurrentDirectory() {
			return cwd;
		},
		isCaseSensitiveFS() {
			return caseSensitiveFS;
		},
		readDirectory(directoryPathAbsolute) {
			const result: LinterHostDirectoryEntry[] = [];
			const dirents = fs.readdirSync(directoryPathAbsolute, {
				withFileTypes: true,
			});

			for (const entry of dirents) {
				let stat = entry as Pick<typeof entry, "isDirectory" | "isFile">;
				if (entry.isSymbolicLink()) {
					try {
						stat = fs.statSync(path.join(directoryPathAbsolute, entry.name));
					} catch {
						continue;
					}
				}
				if (stat.isDirectory()) {
					result.push({ name: entry.name, type: "directory" });
				}
				if (stat.isFile()) {
					result.push({ name: entry.name, type: "file" });
				}
			}

			return result;
		},
		readFile(filePathAbsolute) {
			return fs.readFileSync(filePathAbsolute, "utf8");
		},
		stat(pathAbsolute) {
			try {
				const stat = fs.statSync(pathAbsolute);
				if (stat.isDirectory()) {
					return "directory";
				}
				if (stat.isFile()) {
					return "file";
				}
			} catch {} // eslint-disable-line no-empty
			return undefined;
		},
		watchDirectory(
			directoryPathAbsolute,
			recursive,
			callback,
			pollingInterval = 2_000,
		) {
			directoryPathAbsolute = normalizePath(
				directoryPathAbsolute,
				caseSensitiveFS,
			);

			return createWatcher(
				directoryPathAbsolute,
				recursive,
				pollingInterval,
				(normalizedChangedFilePath) => {
					normalizedChangedFilePath ??= directoryPathAbsolute;
					if (normalizedChangedFilePath !== directoryPathAbsolute) {
						let relative = normalizedChangedFilePath;
						if (relative.startsWith(directoryPathAbsolute + "/")) {
							relative = relative.slice(directoryPathAbsolute.length);
						}
						for (const ignored of ignoredPaths) {
							if (
								relative.endsWith(ignored) ||
								relative.includes(ignored + "/")
							) {
								return;
							}
						}
					}
					callback(normalizedChangedFilePath);
				},
			);
		},
		watchFile(filePathAbsolute, callback, pollingInterval = 2_000) {
			filePathAbsolute = normalizePath(filePathAbsolute, caseSensitiveFS);

			return createWatcher(
				filePathAbsolute,
				false,
				pollingInterval,
				(normalizedChangedFilePath, event) => {
					if (normalizedChangedFilePath === filePathAbsolute) {
						callback(event);
					}
				},
			);
		},
	};
}

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
					(_event, filename) => {
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
		fileTypeSync(pathAbsolute) {
			try {
				const stat = fs.statSync(pathAbsolute);
				if (stat.isDirectory()) {
					return "directory";
				}
				if (stat.isFile()) {
					return "file";
				}
			} catch {
				// Fall through to undefined.
			}
			return undefined;
		},
		getCurrentDirectory() {
			return cwd;
		},
		async getFileTouchTime(filePath) {
			const stat = await fs.promises.stat(filePath);
			return stat.mtimeMs;
		},
		getFileTouchTimeSync(filePath) {
			return fs.statSync(filePath).mtimeMs;
		},
		isCaseSensitiveFS() {
			return caseSensitiveFS;
		},
		async readDirectory(directoryPathAbsolute) {
			const dirents = await fs.promises.readdir(directoryPathAbsolute, {
				withFileTypes: true,
			});

			const result = await Promise.all(
				dirents.map(async (entry): Promise<[] | LinterHostDirectoryEntry> => {
					let stat: Pick<typeof entry, "isDirectory" | "isFile"> = entry;
					if (entry.isSymbolicLink()) {
						try {
							stat = await fs.promises.stat(
								path.join(directoryPathAbsolute, entry.name),
							);
						} catch {
							return [];
						}
					}
					if (stat.isDirectory()) {
						return { name: entry.name, type: "directory" };
					} else if (stat.isFile()) {
						return { name: entry.name, type: "file" };
					}

					return [];
				}),
			);

			return result.flat();
		},
		readDirectorySync(directoryPathAbsolute) {
			const result: LinterHostDirectoryEntry[] = [];
			const dirents = fs.readdirSync(directoryPathAbsolute, {
				withFileTypes: true,
			});

			for (const entry of dirents) {
				let stat: Pick<typeof entry, "isDirectory" | "isFile"> = entry;
				if (entry.isSymbolicLink()) {
					try {
						stat = fs.statSync(path.join(directoryPathAbsolute, entry.name));
					} catch {
						continue;
					}
				}
				if (stat.isDirectory()) {
					result.push({ name: entry.name, type: "directory" });
				} else if (stat.isFile()) {
					result.push({ name: entry.name, type: "file" });
				}
			}

			return result;
		},
		async readFile(filePathAbsolute) {
			try {
				return await fs.promises.readFile(filePathAbsolute, "utf8");
			} catch {
				return undefined;
			}
		},
		readFileSync(filePathAbsolute) {
			try {
				return fs.readFileSync(filePathAbsolute, "utf8");
			} catch {
				return undefined;
			}
		},
		watchDirectorySync(directoryPathAbsolute, callback, options) {
			directoryPathAbsolute = normalizePath(
				directoryPathAbsolute,
				caseSensitiveFS,
			);

			return createWatcher(
				directoryPathAbsolute,
				options.recursive,
				options.pollingInterval ?? 2_000,
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
		watchFileSync(filePathAbsolute, callback, options) {
			filePathAbsolute = normalizePath(filePathAbsolute, caseSensitiveFS);

			return createWatcher(
				filePathAbsolute,
				false,
				options?.pollingInterval ?? 2_000,
				(normalizedChangedFilePath, event) => {
					if (normalizedChangedFilePath === filePathAbsolute) {
						callback(event);
					}
				},
			);
		},
		async writeFile(filePathAbsolute, content) {
			await fs.promises.writeFile(filePathAbsolute, content, "utf8");
		},
		writeFileSync(filePathAbsolute, content) {
			fs.writeFileSync(filePathAbsolute, content, "utf8");
		},
	};
}

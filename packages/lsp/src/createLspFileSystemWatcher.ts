import { fileURLToPath } from "node:url";

import { FileChangeType, type Connection } from "vscode-languageserver/node.js";

import type {
	FileSystemWatcher,
	LinterHostFileWatcher,
	LinterHostFileWatcherEvent,
	WatchDirectoryOptions,
} from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/utils";

export interface LspFileSystemWatcher extends FileSystemWatcher {
	watchDirectoryWithEventSync(
		this: void,
		directoryPathAbsolute: string,
		callback: LspFileSystemDirectoryWatcher,
		options: WatchDirectoryOptions,
	): Disposable;
}

type LspFileSystemDirectoryWatcher = (
	filePathAbsolute: string,
	event: LinterHostFileWatcherEvent,
) => void;

interface DirectorySubscription {
	callback: LspFileSystemDirectoryWatcher;
	recursive: boolean;
	rootPath: string;
}

const FILE_CHANGE_TYPE_TO_EVENT: Record<
	FileChangeType,
	LinterHostFileWatcherEvent
> = {
	[FileChangeType.Changed]: "changed",
	[FileChangeType.Created]: "created",
	[FileChangeType.Deleted]: "deleted",
};

/**
 * `FileSystemWatcher` backed by the LSP's `workspace/onDidChangeWatchedFiles`
 * notifications.
 */
export function createLspFileSystemWatcher(
	connection: Connection,
): LspFileSystemWatcher {
	const directorySubs = new Set<DirectorySubscription>();
	const fileSubs = new Map<string, Set<LinterHostFileWatcher>>();

	connection.onDidChangeWatchedFiles((params) => {
		for (const change of params.changes) {
			const filePath = normalizePath(fileURLToPath(change.uri));
			const event = FILE_CHANGE_TYPE_TO_EVENT[change.type];

			for (const sub of directorySubs) {
				if (isFileUnderDirectory(filePath, sub.rootPath, sub.recursive)) {
					sub.callback(filePath, event);
				}
			}

			const fileWatchers = fileSubs.get(filePath);
			if (fileWatchers) {
				for (const cb of fileWatchers) {
					cb(event);
				}
			}
		}
	});

	function watchDirectoryWithEventSync(
		directoryPathAbsolute: string,
		callback: LspFileSystemDirectoryWatcher,
		options: WatchDirectoryOptions,
	) {
		const sub: DirectorySubscription = {
			callback,
			recursive: options.recursive,
			rootPath: normalizePath(directoryPathAbsolute),
		};
		directorySubs.add(sub);
		return {
			[Symbol.dispose]() {
				directorySubs.delete(sub);
			},
		};
	}

	return {
		watchDirectorySync(directoryPathAbsolute, callback, options) {
			return watchDirectoryWithEventSync(
				directoryPathAbsolute,
				callback,
				options,
			);
		},
		watchDirectoryWithEventSync,
		watchFileSync(filePathAbsolute, callback) {
			const normalized = normalizePath(filePathAbsolute);
			let set = fileSubs.get(normalized);
			if (!set) {
				set = new Set();
				fileSubs.set(normalized, set);
			}
			set.add(callback);
			return {
				[Symbol.dispose]() {
					const current = fileSubs.get(normalized);
					if (!current) {
						return;
					}
					current.delete(callback);
					if (!current.size) {
						fileSubs.delete(normalized);
					}
				},
			};
		},
	};
}

function isFileUnderDirectory(
	filePath: string,
	rootPath: string,
	recursive: boolean,
): boolean {
	if (filePath === rootPath) {
		return true;
	}
	if (!filePath.startsWith(rootPath + "/")) {
		return false;
	}
	if (recursive) {
		return true;
	}
	const remainder = filePath.slice(rootPath.length + 1);
	return !remainder.includes("/");
}

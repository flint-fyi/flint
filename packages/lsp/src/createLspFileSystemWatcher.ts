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
	watchDirectoryWithEventSync: (
		directoryPathAbsolute: string,
		callback: LspFileSystemDirectoryWatcher,
		options: WatchDirectoryOptions,
	) => Disposable;
}

interface DirectorySubscription {
	callback: LspFileSystemDirectoryWatcher;
	recursive: boolean;
	rootPath: string;
}

type LspFileSystemDirectoryWatcher = (
	filePathAbsolute: string,
	event: LinterHostFileWatcherEvent,
) => void;

const FILE_CHANGE_TYPE_TO_EVENT: Record<
	FileChangeType,
	LinterHostFileWatcherEvent
> = {
	[FileChangeType.Changed]: "changed",
	[FileChangeType.Created]: "created",
	[FileChangeType.Deleted]: "deleted",
};

export function createLspFileSystemWatcher(
	connection: Connection,
): LspFileSystemWatcher {
	const directorySubscriptions = new Set<DirectorySubscription>();
	const fileSubscriptions = new Map<string, Set<LinterHostFileWatcher>>();

	connection.onDidChangeWatchedFiles((watchedFilesParams) => {
		for (const change of watchedFilesParams.changes) {
			const filePath = normalizePath(fileURLToPath(change.uri));
			const event = FILE_CHANGE_TYPE_TO_EVENT[change.type];

			for (const subscription of directorySubscriptions) {
				if (
					isFileUnderDirectory(
						filePath,
						subscription.rootPath,
						subscription.recursive,
					)
				) {
					subscription.callback(filePath, event);
				}
			}

			const fileWatchers = fileSubscriptions.get(filePath);
			if (fileWatchers) {
				for (const callback of fileWatchers) {
					callback(event);
				}
			}
		}
	});

	function watchDirectoryWithEventSync(
		directoryPathAbsolute: string,
		callback: LspFileSystemDirectoryWatcher,
		options: WatchDirectoryOptions,
	) {
		const subscription: DirectorySubscription = {
			callback,
			recursive: options.recursive,
			rootPath: normalizePath(directoryPathAbsolute),
		};
		directorySubscriptions.add(subscription);
		return {
			[Symbol.dispose]() {
				directorySubscriptions.delete(subscription);
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
			const normalizedFilePath = normalizePath(filePathAbsolute);
			let fileWatchers = fileSubscriptions.get(normalizedFilePath);
			if (!fileWatchers) {
				fileWatchers = new Set();
				fileSubscriptions.set(normalizedFilePath, fileWatchers);
			}
			fileWatchers.add(callback);
			return {
				[Symbol.dispose]() {
					const currentFileWatchers = fileSubscriptions.get(normalizedFilePath);
					if (!currentFileWatchers) {
						return;
					}
					currentFileWatchers.delete(callback);
					if (!currentFileWatchers.size) {
						fileSubscriptions.delete(normalizedFilePath);
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
) {
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

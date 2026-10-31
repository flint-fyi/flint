import path from "node:path";
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
	watchDirectorySync: (
		directoryPathAbsolute: string,
		callback: LspFileSystemDirectoryWatcher,
		options: WatchDirectoryOptions,
	) => Disposable;
}

interface DirectorySubscription {
	callback: LspFileSystemDirectoryWatcher;
	ignoredPaths: string[];
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
				if (isWatchedBy(subscription, filePath)) {
					subscription.callback(filePath, event);
				}
			}

			for (const callback of fileSubscriptions.get(filePath) ?? []) {
				callback(event);
			}
		}
	});

	return {
		watchDirectorySync(directoryPathAbsolute, callback, options) {
			const subscription: DirectorySubscription = {
				callback,
				ignoredPaths: options.ignoredPaths,
				recursive: options.recursive,
				rootPath: normalizePath(directoryPathAbsolute),
			};
			directorySubscriptions.add(subscription);
			return {
				[Symbol.dispose]() {
					directorySubscriptions.delete(subscription);
				},
			};
		},
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
					if (fileWatchers.delete(callback) && !fileWatchers.size) {
						fileSubscriptions.delete(normalizedFilePath);
					}
				},
			};
		},
	};
}

function isWatchedBy(
	{ ignoredPaths, recursive, rootPath }: DirectorySubscription,
	filePath: string,
) {
	if (filePath === rootPath) {
		return true;
	}

	if (!filePath.startsWith(rootPath + "/")) {
		return false;
	}

	const relativePath = filePath.slice(rootPath.length);

	return (
		(recursive || path.posix.dirname(filePath) === rootPath) &&
		ignoredPaths.every(
			(ignoredPath) =>
				!relativePath.endsWith(ignoredPath) &&
				!relativePath.includes(ignoredPath + "/"),
		)
	);
}

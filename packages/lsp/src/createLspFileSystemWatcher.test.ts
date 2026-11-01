import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it, vi } from "vitest";
import {
	FileChangeType,
	type Connection,
	type DidChangeWatchedFilesParams,
} from "vscode-languageserver/node.js";

import { normalizePath } from "@flint.fyi/utils";

import { createLspFileSystemWatcher } from "./createLspFileSystemWatcher.ts";

describe(createLspFileSystemWatcher, () => {
	it("dispatches changes to directory and file subscriptions", () => {
		const { emit, watcher } = createTestWatcher();
		const rootPath = normalizePath(path.resolve("workspace"));
		const filePath = normalizePath(path.join(rootPath, "src/file.ts"));
		const directoryCallback = vi.fn();
		const firstFileCallback = vi.fn();
		const secondFileCallback = vi.fn();
		const directorySubscription = watcher.watchDirectorySync(
			rootPath,
			directoryCallback,
			{ ignoredPaths: [], recursive: true },
		);
		const firstFileSubscription = watcher.watchFileSync(
			filePath,
			firstFileCallback,
			{ ignoredPaths: [] },
		);
		const secondFileSubscription = watcher.watchFileSync(
			filePath,
			secondFileCallback,
			{ ignoredPaths: [] },
		);

		emit({
			type: FileChangeType.Changed,
			uri: pathToFileURL(filePath).href,
		});

		expect(directoryCallback).toHaveBeenCalledExactlyOnceWith(
			filePath,
			"changed",
		);
		expect(firstFileCallback).toHaveBeenCalledExactlyOnceWith("changed");
		expect(secondFileCallback).toHaveBeenCalledExactlyOnceWith("changed");

		firstFileSubscription[Symbol.dispose]();
		emit({
			type: FileChangeType.Created,
			uri: pathToFileURL(filePath).href,
		});

		expect(firstFileCallback).toHaveBeenCalledTimes(1);
		expect(secondFileCallback).toHaveBeenLastCalledWith("created");

		secondFileSubscription[Symbol.dispose]();
		secondFileSubscription[Symbol.dispose]();
		directorySubscription[Symbol.dispose]();
		emit({
			type: FileChangeType.Deleted,
			uri: pathToFileURL(filePath).href,
		});

		expect(directoryCallback).toHaveBeenCalledTimes(2);
		expect(secondFileCallback).toHaveBeenCalledTimes(2);
	});

	it("limits non-recursive directory subscriptions to direct children", () => {
		const { emit, watcher } = createTestWatcher();
		const rootPath = normalizePath(path.resolve("workspace"));
		const callback = vi.fn();
		const subscription = watcher.watchDirectorySync(rootPath, callback, {
			ignoredPaths: [],
			recursive: false,
		});

		emit(
			{
				type: FileChangeType.Changed,
				uri: pathToFileURL(rootPath).href,
			},
			{
				type: FileChangeType.Changed,
				uri: pathToFileURL(path.join(rootPath, "direct.ts")).href,
			},
			{
				type: FileChangeType.Changed,
				uri: pathToFileURL(path.join(rootPath, "nested/file.ts")).href,
			},
			{
				type: FileChangeType.Changed,
				uri: pathToFileURL(path.resolve("outside.ts")).href,
			},
		);

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(1, rootPath, "changed");
		expect(callback).toHaveBeenNthCalledWith(
			2,
			normalizePath(path.join(rootPath, "direct.ts")),
			"changed",
		);

		subscription[Symbol.dispose]();
	});

	it("skips changes under ignored paths", () => {
		const { emit, watcher } = createTestWatcher();
		const rootPath = normalizePath(path.resolve("workspace"));
		const callback = vi.fn();
		const subscription = watcher.watchDirectorySync(rootPath, callback, {
			ignoredPaths: ["/node_modules"],
			recursive: true,
		});

		emit(
			{
				type: FileChangeType.Changed,
				uri: pathToFileURL(path.join(rootPath, "node_modules/lib/package.json"))
					.href,
			},
			{
				type: FileChangeType.Changed,
				uri: pathToFileURL(path.join(rootPath, "src/file.ts")).href,
			},
		);

		expect(callback).toHaveBeenCalledExactlyOnceWith(
			normalizePath(path.join(rootPath, "src/file.ts")),
			"changed",
		);

		subscription[Symbol.dispose]();
	});
});

function createTestWatcher() {
	let watchedFilesHandler:
		((params: DidChangeWatchedFilesParams) => void) | undefined;
	const connection = {
		onDidChangeWatchedFiles(
			handler: (params: DidChangeWatchedFilesParams) => void,
		) {
			watchedFilesHandler = handler;
		},
	} as unknown as Connection;

	return {
		emit: (...changes: DidChangeWatchedFilesParams["changes"]) => {
			watchedFilesHandler?.({ changes });
		},
		watcher: createLspFileSystemWatcher(connection),
	};
}

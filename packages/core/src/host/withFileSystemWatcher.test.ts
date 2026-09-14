import { describe, expect, it, vi } from "vitest";

import type { FileSystemWatcher, LinterHost } from "../index.ts";
import { withFileSystemWatcher } from "./withFileSystemWatcher.ts";

describe(withFileSystemWatcher, () => {
	it("delegates watch methods to the watcher and passes everything else through", () => {
		const disposable: Disposable = {
			[Symbol.dispose]: vi.fn(),
		};
		const watchDirectorySync = vi.fn(() => disposable);
		const watchFileSync = vi.fn(() => disposable);
		const watcher: FileSystemWatcher = { watchDirectorySync, watchFileSync };

		const baseWatchDirectorySync = vi.fn();
		const baseWatchFileSync = vi.fn();
		const baseHost = {
			getCurrentDirectory: () => "/root",
			readFileSync: vi.fn(() => "contents"),
			watchDirectorySync: baseWatchDirectorySync,
			watchFileSync: baseWatchFileSync,
		} as unknown as LinterHost;

		const host = withFileSystemWatcher(baseHost, watcher);

		const directoryCallback = vi.fn();
		const fileCallback = vi.fn();
		host.watchDirectorySync("/dir", directoryCallback, {
			ignoredPaths: [],
			recursive: true,
		});
		host.watchFileSync("/file", fileCallback, { ignoredPaths: [] });

		expect(watchDirectorySync).toHaveBeenCalledWith("/dir", directoryCallback, {
			ignoredPaths: [],
			recursive: true,
		});
		expect(watchFileSync).toHaveBeenCalledWith("/file", fileCallback, {
			ignoredPaths: [],
		});
		expect(baseWatchDirectorySync).not.toHaveBeenCalled();
		expect(baseWatchFileSync).not.toHaveBeenCalled();

		expect(host.getCurrentDirectory()).toBe("/root");
		expect(host.readFileSync("/file")).toBe("contents");
	});
});

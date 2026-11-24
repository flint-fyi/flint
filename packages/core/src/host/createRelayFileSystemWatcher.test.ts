import { describe, expect, it, vi } from "vitest";

import { createRelayFileSystemWatcher } from "./createRelayFileSystemWatcher.ts";
import { createVFSLinterHost } from "./createVFSLinterHost.ts";

function createTestWatcher() {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
	const watcher = createRelayFileSystemWatcher(host, {
		directoryPath: "/root",
		ignoredPaths: ["/.git"],
	});
	return { host, watcher };
}

describe(createRelayFileSystemWatcher, () => {
	it("reports created, changed, and deleted events to file watchers", () => {
		const { host, watcher } = createTestWatcher();
		const callback = vi.fn();
		watcher.watchFileSync("/root/a.ts", callback, { ignoredPaths: [] });

		host.vfsUpsertFile("/root/a.ts", "1");
		watcher.notifyChange("/root/a.ts");
		host.vfsUpsertFile("/root/a.ts", "2");
		watcher.notifyChange("/root/a.ts");
		host.vfsDeleteFile("/root/a.ts");
		watcher.notifyChange("/root/a.ts");

		expect(callback.mock.calls).toEqual([
			["created"],
			["changed"],
			["deleted"],
		]);
	});

	it("does not report a file that is still missing", () => {
		const { watcher } = createTestWatcher();
		const callback = vi.fn();
		watcher.watchFileSync("/root/a.ts", callback, { ignoredPaths: [] });

		watcher.notifyChange("/root/a.ts");

		expect(callback).not.toHaveBeenCalled();
	});

	it("reports descendants to recursive directory watchers", () => {
		const { watcher } = createTestWatcher();
		const callback = vi.fn();
		watcher.watchDirectorySync("/root", callback, {
			ignoredPaths: [],
			recursive: true,
		});

		watcher.notifyChange("/root/src/nested/a.ts");

		expect(callback).toHaveBeenCalledExactlyOnceWith("/root/src/nested/a.ts");
	});

	it("reports only direct children to non-recursive directory watchers", () => {
		const { watcher } = createTestWatcher();
		const callback = vi.fn();
		watcher.watchDirectorySync("/root/src", callback, {
			ignoredPaths: [],
			recursive: false,
		});

		watcher.notifyChange("/root/src/nested/a.ts");
		watcher.notifyChange("/root/src/a.ts");

		expect(callback).toHaveBeenCalledExactlyOnceWith("/root/src/a.ts");
	});

	it("reports a changed directory to its own non-recursive watchers", () => {
		const { watcher } = createTestWatcher();
		const callback = vi.fn();
		watcher.watchDirectorySync("/root/src", callback, {
			ignoredPaths: [],
			recursive: false,
		});

		watcher.notifyChange("/root/src");

		expect(callback).toHaveBeenCalledExactlyOnceWith("/root/src");
	});

	it("reports a changed directory to watchers of its descendant directories", () => {
		const { watcher } = createTestWatcher();
		const callback = vi.fn();
		watcher.watchDirectorySync("/root/src/nested", callback, {
			ignoredPaths: [],
			recursive: true,
		});

		watcher.notifyChange("/root/src");

		expect(callback).toHaveBeenCalledExactlyOnceWith("/root/src/nested");
	});

	it("reports a changed directory to watchers of files inside it", () => {
		const { host, watcher } = createTestWatcher();
		const callback = vi.fn();
		watcher.watchFileSync("/root/src/pkg/package.json", callback, {
			ignoredPaths: [],
		});

		host.vfsUpsertFile("/root/src/pkg/package.json", "{}");
		watcher.notifyChange("/root/src");
		host.vfsDeleteFile("/root/src/pkg/package.json");
		watcher.notifyChange("/root/src");

		expect(callback.mock.calls).toEqual([["created"], ["deleted"]]);
	});

	it("skips ignored paths for directory watchers", () => {
		const { watcher } = createTestWatcher();
		const callback = vi.fn();
		watcher.watchDirectorySync("/root", callback, {
			ignoredPaths: ["/node_modules"],
			recursive: true,
		});

		watcher.notifyChange("/root/node_modules/package/index.ts");

		expect(callback).not.toHaveBeenCalled();
	});

	it("stops reporting after a watcher is disposed", () => {
		const { host, watcher } = createTestWatcher();
		const callback = vi.fn();
		host.vfsUpsertFile("/root/a.ts", "1");
		const subscription = watcher.watchFileSync("/root/a.ts", callback, {
			ignoredPaths: [],
		});

		subscription[Symbol.dispose]();
		watcher.notifyChange("/root/a.ts");

		expect(callback).not.toHaveBeenCalled();
	});

	it("does not open host watchers for covered paths", () => {
		const { host, watcher } = createTestWatcher();
		const hostWatchDirectorySync = vi.spyOn(host, "watchDirectorySync");
		const hostWatchFileSync = vi.spyOn(host, "watchFileSync");

		watcher.watchFileSync("/root/a.ts", vi.fn(), { ignoredPaths: [] });
		watcher.watchDirectorySync("/root/src", vi.fn(), {
			ignoredPaths: [],
			recursive: true,
		});

		expect(hostWatchFileSync).not.toHaveBeenCalled();
		expect(hostWatchDirectorySync).not.toHaveBeenCalled();
	});

	it("opens host watchers for paths the coverage ignores", () => {
		const { host, watcher } = createTestWatcher();
		const hostWatchFileSync = vi.spyOn(host, "watchFileSync");

		watcher.watchFileSync("/root/.git/HEAD", vi.fn(), { ignoredPaths: [] });

		expect(hostWatchFileSync).toHaveBeenCalledOnce();
	});

	it("delegates watchers outside the covered directory to the host", () => {
		const { host, watcher } = createTestWatcher();
		const hostWatchDirectorySync = vi.spyOn(host, "watchDirectorySync");
		const hostWatchFileSync = vi.spyOn(host, "watchFileSync");
		const directoryCallback = vi.fn();
		const fileCallback = vi.fn();

		watcher.watchDirectorySync("/outside", directoryCallback, {
			ignoredPaths: [],
			recursive: true,
		});
		watcher.watchFileSync("/outside/a.ts", fileCallback, { ignoredPaths: [] });
		host.vfsUpsertFile("/outside/a.ts", "1");

		expect(hostWatchDirectorySync).toHaveBeenCalledOnce();
		expect(hostWatchFileSync).toHaveBeenCalledOnce();
		expect(directoryCallback).toHaveBeenCalledExactlyOnceWith("/outside/a.ts");
		expect(fileCallback).toHaveBeenCalledExactlyOnceWith("created");
	});

	it("keeps a later watcher when an earlier one is disposed twice", () => {
		const { host, watcher } = createTestWatcher();
		const callback = vi.fn();
		const first = watcher.watchFileSync("/root/a.ts", vi.fn(), {
			ignoredPaths: [],
		});

		first[Symbol.dispose]();
		watcher.watchFileSync("/root/a.ts", callback, { ignoredPaths: [] });
		first[Symbol.dispose]();
		host.vfsUpsertFile("/root/a.ts", "1");
		watcher.notifyChange("/root/a.ts");

		expect(callback).toHaveBeenCalledExactlyOnceWith("created");
	});
});

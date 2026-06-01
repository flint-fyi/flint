import type { FileSystemWatcher, LinterHost } from "../types/host.ts";

export function withFileSystemWatcher(
	host: LinterHost,
	watcher: FileSystemWatcher,
): LinterHost {
	return {
		...host,
		watchDirectorySync: watcher.watchDirectorySync.bind(watcher),
		watchFileSync: watcher.watchFileSync.bind(watcher),
	};
}

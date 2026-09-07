import type { FileSystemWatcher, LinterHost } from "../types/host.ts";

export function withFileSystemWatcher(
	host: LinterHost,
	watcher: FileSystemWatcher,
): LinterHost {
	return {
		...host,
		...watcher,
	};
}

export interface LinterHost {
	getCurrentDirectory(): string;
	isCaseSensitiveFS(): boolean;
	readDirectory(directoryPathAbsolute: string): LinterHostDirectoryEntry[];
	readFile(filePathAbsolute: string): string | undefined;
	stat(pathAbsolute: string): "directory" | "file" | undefined;
	watchDirectory(
		directoryPathAbsolute: string,
		callback: LinterHostDirectoryWatcher,
		options: WatchDirectoryOptions,
	): Disposable;
	watchFile(
		filePathAbsolute: string,
		callback: LinterHostFileWatcher,
		options?: WatchOptions,
	): Disposable;
}

export interface LinterHostDirectoryEntry {
	name: string;
	type: "directory" | "file";
}
export type LinterHostDirectoryWatcher = (filePathAbsolute: string) => void;

export type LinterHostFileWatcher = (event: LinterHostFileWatcherEvent) => void;

export type LinterHostFileWatcherEvent = "changed" | "created" | "deleted";

export interface VFSLinterHost extends LinterHost {
	vfsDeleteFile(filePathAbsolute: string): void;
	vfsListFiles(): ReadonlyMap<string, string>;
	vfsUpsertFile(filePathAbsolute: string, content: string): void;
}

export interface WatchDirectoryOptions extends WatchOptions {
	recursive: boolean;
}

export interface WatchOptions {
	pollingInterval?: number;
}

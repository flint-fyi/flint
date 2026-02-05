export interface LinterHost {
	fileTypeSync(pathAbsolute: string): "directory" | "file" | undefined;
	getCurrentDirectory(): string;
	isCaseSensitiveFS(): boolean;
	readDirectorySync(directoryPathAbsolute: string): LinterHostDirectoryEntry[];
	readFileSync(filePathAbsolute: string): string | undefined;
	watchDirectorySync(
		directoryPathAbsolute: string,
		callback: LinterHostDirectoryWatcher,
		options: WatchDirectoryOptions,
	): Disposable;
	watchFileSync(
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

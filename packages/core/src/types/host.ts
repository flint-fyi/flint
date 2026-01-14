export interface LinterHost {
	getCurrentDirectory(): string;
	isCaseSensitiveFS(): boolean;
	readDirectory(directoryPathAbsolute: string): LinterHostDirectoryEntry[];
	readFile(filePathAbsolute: string): string | undefined;
	stat(pathAbsolute: string): "directory" | "file" | undefined;
	watchDirectory(
		directoryPathAbsolute: string,
		recursive: boolean,
		callback: LinterHostDirectoryWatcher,
		pollingInterval?: number,
	): Disposable;
	watchFile(
		filePathAbsolute: string,
		callback: LinterHostFileWatcher,
		pollingInterval?: number,
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

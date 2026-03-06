export interface LinterHost {
	fileTypeSync(pathAbsolute: string): "directory" | "file" | undefined;
	getCurrentDirectory(): string;
	getFileTouchTime(filePath: string): Promise<number>;
	getFileTouchTimeSync(filePath: string): number;
	isCaseSensitiveFS(): boolean;
	readDirectory(
		directoryPathAbsolute: string,
	): Promise<LinterHostDirectoryEntry[]>;
	readDirectorySync(directoryPathAbsolute: string): LinterHostDirectoryEntry[];
	readFile(filePathAbsolute: string): Promise<string | undefined>;
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
	writeFile(filePathAbsolute: string, content: string): Promise<void>;
	writeFileSync(filePathAbsolute: string, content: string): void;
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

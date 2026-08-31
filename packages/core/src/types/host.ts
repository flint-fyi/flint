import type { commonlyIgnoredGlobs } from "../host/watcher.ts";

export interface LinterHost {
	fileTypeSync(pathAbsolute: string): "directory" | "file" | undefined;
	getCurrentDirectory(): string;
	getFileTouchTime(filePath: string): Promise<number | undefined>;
	getFileTouchTimeSync(filePath: string): number | undefined;
	getRepositoryRoot(): string | undefined;

	/**
	 * Find a set of files relative to the cwd given a set of glob patterns.
	 * @param patterns An array of glob patterns, to be parsed by Picomatch with `{ dot: true }`.
	 * @param options An options bag, wherein you must set the cwd and exclusions.
	 */
	glob(patterns: string[], options: LinterHostGlobOptions): Promise<string[]>;
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
		options: WatchOptions,
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

export interface LinterHostGlobOptions {
	cwd: string;
	/** Generally, you'll want to include {@linkcode commonlyIgnoredGlobs}. */
	exclude: string[];
}

export interface VFSLinterHost extends LinterHost {
	vfsDeleteFile(filePathAbsolute: string): void;
	vfsListFiles(): ReadonlyMap<string, string>;
	vfsUpsertFile(filePathAbsolute: string, content: string): void;
}

export interface WatchDirectoryOptions extends WatchOptions {
	recursive: boolean;
}

export interface WatchOptions {
	ignoredPaths: string[];
	pollingInterval?: number;
}

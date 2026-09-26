import timers from "node:timers";

import { resolve } from "pathe";
import ts from "typescript";

import { commonlyIgnoredPaths, type LinterHost } from "@flint.fyi/core";
import { FlintAssertionError } from "@flint.fyi/utils";

function serverHostMethodNotImplemented(methodName: string): never {
	throw new FlintAssertionError(
		`ts.ServerHost's method '${methodName}' is not implemented.`,
	);
}

// Internal API: the glob matcher behind `ts.sys.readDirectory`, which takes
// its directory listings from a callback instead of the disk. It is not in
// TypeScript's public typings but is exported at runtime.
// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/utilities.ts
const { matchFiles } = ts as unknown as {
	matchFiles: (
		path: string,
		extensions: readonly string[] | undefined,
		excludes: readonly string[] | undefined,
		includes: readonly string[] | undefined,
		useCaseSensitiveFileNames: boolean,
		currentDirectory: string,
		depth: number | undefined,
		getFileSystemEntries: (path: string) => {
			directories: readonly string[];
			files: readonly string[];
		},
		realpath: (path: string) => string,
	) => string[];
};

export function createTypeScriptServerHost(
	host: LinterHost,
): ts.server.ServerHost {
	const getFileSystemEntries = (directoryPath: string) => {
		const directories: string[] = [];
		const files: string[] = [];
		let entries;
		try {
			entries = host.readDirectorySync(
				resolve(host.getCurrentDirectory(), directoryPath),
			);
		} catch {
			// Like `ts.sys.readDirectory`, an unreadable directory has no entries.
			return { directories, files };
		}
		for (const { name, type } of entries) {
			(type === "directory" ? directories : files).push(name);
		}
		// `ts.sys` sorts its entries, and the project service binary-searches
		// the directory lists it gets back, so they must be sorted here too.
		return { directories: directories.sort(), files: files.sort() };
	};
	// Virtual hosts have nothing on disk to resolve; TypeScript's own realpath
	// already answers with the path itself when it cannot be resolved.
	const realpath = (path: string) => ts.sys.realpath?.(path) ?? path;

	return {
		...ts.sys,
		args: [],
		clearImmediate: timers.clearImmediate,
		clearTimeout: timers.clearTimeout,
		createDirectory() {
			serverHostMethodNotImplemented("createDirectory");
		},
		directoryExists(directoryPath) {
			return (
				host.fileTypeSync(
					resolve(host.getCurrentDirectory(), directoryPath),
				) === "directory"
			);
		},
		exit() {
			serverHostMethodNotImplemented("exit");
		},
		fileExists(filePath) {
			return (
				host.fileTypeSync(resolve(host.getCurrentDirectory(), filePath)) ===
				"file"
			);
		},
		getCurrentDirectory() {
			return host.getCurrentDirectory();
		},
		readDirectory(directoryPath, extensions, exclude, include, depth) {
			// The project service asks for one directory at a time (thousands of
			// calls over a run), so the matcher is fed the host's listings directly
			// rather than through `ts.sys.readDirectory` with `fs` patched per call.
			return matchFiles(
				directoryPath,
				extensions,
				exclude,
				include,
				host.isCaseSensitiveFS(),
				host.getCurrentDirectory(),
				depth,
				getFileSystemEntries,
				realpath,
			);
		},
		readFile(filePath) {
			return host.readFileSync(resolve(host.getCurrentDirectory(), filePath));
		},
		setImmediate: timers.setImmediate,
		setTimeout: timers.setTimeout,
		watchDirectory(directoryPath, callback, recursive = false) {
			const watcher = host.watchDirectorySync(
				resolve(host.getCurrentDirectory(), directoryPath),
				(filePathAbsolute) => {
					callback(filePathAbsolute);
				},
				{ ignoredPaths: commonlyIgnoredPaths, recursive },
			);
			return {
				close() {
					watcher[Symbol.dispose]();
				},
			};
		},
		watchFile(filePath, callback) {
			const watcher = host.watchFileSync(
				resolve(host.getCurrentDirectory(), filePath),
				(event) => {
					let eventKind: ts.FileWatcherEventKind;
					switch (event) {
						case "changed":
							eventKind = ts.FileWatcherEventKind.Changed;
							break;
						case "created":
							eventKind = ts.FileWatcherEventKind.Created;
							break;
						case "deleted":
							eventKind = ts.FileWatcherEventKind.Deleted;
							break;
					}
					callback(filePath, eventKind);
				},
				{ ignoredPaths: commonlyIgnoredPaths },
			);
			return {
				close() {
					watcher[Symbol.dispose]();
				},
			};
		},
		write() {
			serverHostMethodNotImplemented("write");
		},
		writeFile() {
			serverHostMethodNotImplemented("writeFile");
		},
	};
}

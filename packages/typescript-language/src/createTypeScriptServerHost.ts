import { join, resolve } from "pathe";
import ts from "typescript";

import { commonlyIgnoredPaths, type LinterHost } from "@flint.fyi/core";
import { FlintAssertionError } from "@flint.fyi/utils";

const sys: ts.System | undefined = ts.sys;

// eslint-disable-next-line @typescript-eslint/no-restricted-types
type Timeout = ReturnType<typeof setTimeout>;

export function createTypeScriptServerHost(
	host: LinterHost,
): ts.server.ServerHost {
	const useCaseSensitiveFileNames = host.isCaseSensitiveFS();

	function realpath(filePath: string) {
		return sys?.realpath?.(filePath) ?? filePath;
	}

	function resolvePath(filePath: string) {
		return resolve(host.getCurrentDirectory(), filePath);
	}

	function getFileSystemEntries(directoryPath: string) {
		const directories: string[] = [];
		const files: string[] = [];

		if (host.fileTypeSync(directoryPath) === "directory") {
			for (const entry of host.readDirectorySync(directoryPath)) {
				(entry.type === "directory" ? directories : files).push(entry.name);
			}
		}

		return { directories: directories.toSorted(), files: files.toSorted() };
	}

	return {
		args: [],
		// https://github.com/microsoft/vscode/blob/2d698cf0544ccd408de942ece55ff916f8d442a8/extensions/typescript-language-features/web/src/serverHost.ts#L86-L88
		clearImmediate(immediate: Timeout) {
			clearTimeout(immediate);
		},
		// https://github.com/microsoft/vscode/blob/2d698cf0544ccd408de942ece55ff916f8d442a8/extensions/typescript-language-features/web/src/serverHost.ts#L80-L82
		// flint-disable-next-line ts/recursionOnlyArguments
		clearTimeout(timeout: Timeout) {
			clearTimeout(timeout);
		},
		createDirectory() {
			serverHostMethodNotImplemented("createDirectory");
		},
		directoryExists(directoryPath) {
			return host.fileTypeSync(resolvePath(directoryPath)) === "directory";
		},
		exit() {
			serverHostMethodNotImplemented("exit");
		},
		fileExists(filePath) {
			return host.fileTypeSync(resolvePath(filePath)) === "file";
		},
		getCurrentDirectory() {
			return host.getCurrentDirectory();
		},
		getDirectories(directoryPath) {
			return getFileSystemEntries(
				resolvePath(directoryPath),
			).directories.slice();
		},
		getExecutingFilePath() {
			return (
				sys?.getExecutingFilePath() ??
				join(
					host.getCurrentDirectory(),
					"node_modules/typescript/lib/typescript.js",
				)
			);
		},
		getModifiedTime(filePath) {
			const touchTime = host.getFileTouchTimeSync(resolvePath(filePath));
			return touchTime === undefined ? undefined : new Date(touchTime);
		},
		// https://github.com/microsoft/TypeScript-Website/blob/ece88b9994c14ccb987f7e47114eea2c2993151f/packages/typescript-vfs/src/index.ts#L522
		newLine: "\n",
		// https://github.com/microsoft/vscode/blob/2d698cf0544ccd408de942ece55ff916f8d442a8/extensions/typescript-language-features/web/src/serverHost.ts#L307-L311
		readDirectory(directoryPath, extensions, exclude, include, depth) {
			return ts.matchFiles(
				resolvePath(directoryPath),
				extensions,
				exclude,
				include,
				useCaseSensitiveFileNames,
				host.getCurrentDirectory(),
				depth,
				getFileSystemEntries,
				realpath,
			);
		},
		readFile(filePath) {
			return host.readFileSync(resolvePath(filePath));
		},
		realpath,
		resolvePath,
		// https://github.com/microsoft/vscode/blob/2d698cf0544ccd408de942ece55ff916f8d442a8/extensions/typescript-language-features/web/src/serverHost.ts#L83-L85
		setImmediate(callback: (...args: unknown[]) => void, ...args: unknown[]) {
			return setTimeout(callback, 0, ...args);
		},
		// https://github.com/microsoft/vscode/blob/2d698cf0544ccd408de942ece55ff916f8d442a8/extensions/typescript-language-features/web/src/serverHost.ts#L77-L79
		setTimeout(
			// flint-disable-lines-begin ts/recursionOnlyArguments
			callback: (...args: unknown[]) => void,
			ms: number,
			// flint-disable-lines-end ts/recursionOnlyArguments
			...args: unknown[]
		) {
			return setTimeout(callback, ms, ...args);
		},
		useCaseSensitiveFileNames,
		watchDirectory(directoryPath, callback, recursive = false) {
			const watcher = host.watchDirectorySync(
				resolvePath(directoryPath),
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
				resolvePath(filePath),
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

function serverHostMethodNotImplemented(methodName: string): never {
	throw new FlintAssertionError(
		`ts.ServerHost's method '${methodName}' is not implemented.`,
	);
}

import type { LinterHost } from "@flint.fyi/core";
import { assert, FlintAssertionError } from "@flint.fyi/utils";
import fs from "node:fs";
import path from "node:path";
import timers from "node:timers";
import ts from "typescript";

function serverHostMethodNotImplemented(methodName: string): never {
	throw new FlintAssertionError(
		`ts.ServerHost's method '${methodName}' is not implemented.`,
	);
}

// Internal API: https://github.com/nodejs/node/blob/7b7f693a98da060e19f2ec12fb99997d5d5524f9/deps/uv/include/uv.h#L1260-L1269
const UV_DIRENT_TYPE = {
	UV_DIRENT_DIR: 2,
	UV_DIRENT_FILE: 1,
};

// Internal API: https://github.com/nodejs/node/blob/7b7f693a98da060e19f2ec12fb99997d5d5524f9/lib/internal/fs/utils.js#L160
const DirentCtor = fs.Dirent as new (
	name: string,
	type: number,
	parentPath: string,
) => fs.Dirent;

export function createTypeScriptServerHost(
	host: LinterHost,
): ts.server.ServerHost {
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
				host.stat(path.resolve(host.getCurrentDirectory(), directoryPath)) ===
				"directory"
			);
		},
		exit() {
			serverHostMethodNotImplemented("exit");
		},
		fileExists(filePath) {
			return (
				host.stat(path.resolve(host.getCurrentDirectory(), filePath)) === "file"
			);
		},
		readDirectory(directoryPath, extensions, exclude, include, depth) {
			const originalCwd = process.cwd.bind(process);
			process.cwd = () => host.getCurrentDirectory();
			const originalReadDirSync = fs.readdirSync;
			// @ts-expect-error - TypeScript doesn't understand that the overloads do match up.
			const patchedReaddirSync: typeof fs.readdirSync = (readPath, options) => {
				assert(
					typeof options === "object" &&
						options != null &&
						Object.keys(options).length === 1 &&
						options.withFileTypes === true,
					`ts.sys.readDirectory passed unexpected options to fs.readdirSync: ${JSON.stringify(options)}`,
				);
				assert(
					typeof readPath === "string",
					"ts.sys.readDirectory passed unexpected path to fs.readdirSync",
				);
				try {
					fs.readdirSync = originalReadDirSync;
					return host
						.readDirectory(path.resolve(host.getCurrentDirectory(), readPath))
						.map(
							(dirent) =>
								new DirentCtor(
									dirent.name,
									dirent.type === "file"
										? UV_DIRENT_TYPE.UV_DIRENT_FILE
										: UV_DIRENT_TYPE.UV_DIRENT_DIR,
									readPath,
								),
						);
				} finally {
					fs.readdirSync = patchedReaddirSync;
				}
			};
			fs.readdirSync = patchedReaddirSync;
			try {
				return ts.sys.readDirectory(
					directoryPath,
					extensions,
					exclude,
					include,
					depth,
				);
			} finally {
				process.cwd = originalCwd;
				fs.readdirSync = originalReadDirSync;
			}
		},
		readFile(filePath) {
			return host.readFile(path.resolve(host.getCurrentDirectory(), filePath));
		},
		setImmediate: timers.setImmediate,
		setTimeout: timers.setTimeout,
		watchDirectory(directoryPath, callback, recursive = false) {
			const watcher = host.watchDirectory(
				path.resolve(host.getCurrentDirectory(), directoryPath),
				recursive,
				(filePathAbsolute) => {
					callback(filePathAbsolute);
				},
			);
			return {
				close() {
					watcher[Symbol.dispose]();
				},
			};
		},
		watchFile(filePath, callback) {
			const watcher = host.watchFile(
				path.resolve(host.getCurrentDirectory(), filePath),
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

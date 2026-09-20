import path from "node:path";

import type { FileSystem } from "typescript-native/unstable/fs";

import type { LinterHost } from "@flint.fyi/core";
import { getPathInsideDirectory } from "@flint.fyi/utils";

import { createVirtualFiles, type VirtualFiles } from "./createVirtualFiles.ts";

export interface TypeScriptFileSystemOptions {
	/**
	 * Whether the host is a direct view of the disk. TypeScript can then read
	 * the disk itself: only Flint's virtual files are served, and the rest of
	 * the file system is not delegated at all. Every delegated answer is a
	 * synchronous round trip out of the native process — TypeScript probes
	 * each ancestor directory of every opened file for a config, and shipping
	 * file contents through the channel costs a read and a serialization per
	 * file — so a host that can be bypassed is.
	 */
	diskBacked?: boolean;
}

export function createTypeScriptFileSystem(
	host: LinterHost,
	onFileAccess?: (fileName: string) => void,
	virtualFiles: VirtualFiles = createVirtualFiles(),
	{ diskBacked = false }: TypeScriptFileSystemOptions = {},
): FileSystem {
	if (diskBacked) {
		return {
			// Reads are still delegated so every file TypeScript touches is
			// observed for change detection, but `undefined` for anything not
			// virtual sends TypeScript to the disk for the contents.
			readFile: (fileName) => {
				onFileAccess?.(fileName);
				return virtualFiles.get(fileName);
			},
		};
	}

	const getVirtualAccessibleEntries = (
		directoryName: string,
	): { directories: Set<string>; files: Set<string> } => {
		const directories = new Set<string>();
		const files = new Set<string>();
		for (const fileName of virtualFiles.keys()) {
			const relativePath = getPathInsideDirectory(directoryName, fileName);
			if (!relativePath) {
				continue;
			}
			const separatorIndex = relativePath.indexOf(path.sep);
			if (separatorIndex === -1) {
				directories.delete(relativePath);
				files.add(relativePath);
			} else {
				const directory = relativePath.slice(0, separatorIndex);
				files.delete(directory);
				directories.add(directory);
			}
		}
		return { directories, files };
	};

	return {
		directoryExists: (directoryName) => {
			if (host.fileTypeSync(directoryName) === "directory") {
				return true;
			}

			for (const fileName of virtualFiles.keys()) {
				if (getPathInsideDirectory(directoryName, fileName)) {
					return true;
				}
			}

			return false;
		},
		fileExists: (fileName) => {
			onFileAccess?.(fileName);
			return (
				virtualFiles.has(fileName) || host.fileTypeSync(fileName) === "file"
			);
		},
		getAccessibleEntries(directoryName) {
			const virtualEntries = getVirtualAccessibleEntries(directoryName);
			const entries =
				host.fileTypeSync(directoryName) === "directory"
					? host.readDirectorySync(directoryName)
					: [];
			const directories = new Set(
				entries
					.filter(({ type }) => type === "directory")
					.map(({ name }) => name),
			);
			const files = new Set(
				entries.filter(({ type }) => type === "file").map(({ name }) => name),
			);
			for (const directory of virtualEntries.directories) {
				files.delete(directory);
				directories.add(directory);
			}
			for (const file of virtualEntries.files) {
				directories.delete(file);
				files.add(file);
			}
			return {
				directories: [...directories],
				files: [...files],
			};
		},
		readFile: (fileName) => {
			onFileAccess?.(fileName);
			return virtualFiles.get(fileName) ?? host.readFileSync(fileName) ?? null;
		},
	};
}

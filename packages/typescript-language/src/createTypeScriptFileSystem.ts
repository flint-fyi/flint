import path from "node:path";

import type { FileSystem } from "typescript-native/unstable/fs";

import type { LinterHost } from "@flint.fyi/core";
import { getPathInsideDirectory } from "@flint.fyi/utils";

import { createVirtualFiles, type VirtualFiles } from "./createVirtualFiles.ts";

export interface TypeScriptFileSystemOptions {
	/**
	 * Whether to answer TypeScript's existence checks and directory listings
	 * as well as its file reads. Only a host that may report files the disk
	 * does not hold needs that: every answer is a synchronous round trip out
	 * of the native process, and TypeScript probes each ancestor directory of
	 * every opened file for a config, which adds up to thousands of probes
	 * per lint pass. Flint's own virtual files only ever need reads.
	 */
	probes?: boolean;
}

export function createTypeScriptFileSystem(
	host: LinterHost,
	onFileAccess?: (fileName: string) => void,
	virtualFiles: VirtualFiles = createVirtualFiles(),
	{ probes = true }: TypeScriptFileSystemOptions = {},
): FileSystem {
	const readFile: FileSystem["readFile"] = (fileName) => {
		onFileAccess?.(fileName);
		return virtualFiles.get(fileName) ?? host.readFileSync(fileName) ?? null;
	};

	if (!probes) {
		return { readFile };
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
		readFile,
	};
}

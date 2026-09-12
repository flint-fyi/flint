import path from "node:path";

import type { FileSystem } from "typescript-native/unstable/fs";

import type { LinterHost } from "@flint.fyi/core";

export function createTypeScriptFileSystem(
	host: LinterHost,
	onFileAccess?: (fileName: string) => void,
	virtualFiles: ReadonlyMap<string, string> = new Map(),
): FileSystem {
	const getVirtualAccessibleEntries = (
		directoryName: string,
	): { directories: Set<string>; files: Set<string> } => {
		const directories = new Set<string>();
		const files = new Set<string>();
		for (const fileName of virtualFiles.keys()) {
			const relativePath = path.relative(directoryName, fileName);
			if (
				!relativePath ||
				relativePath === ".." ||
				relativePath.startsWith(`..${path.sep}`) ||
				path.isAbsolute(relativePath)
			) {
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
			const entries = getVirtualAccessibleEntries(directoryName);
			return !!(entries.directories.size || entries.files.size);
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

import type { FileSystem } from "typescript-native/unstable/fs";

import type { LinterHost } from "@flint.fyi/core";

export function createTypeScriptFileSystem(host: LinterHost): FileSystem {
	return {
		directoryExists: (directoryName) =>
			host.fileTypeSync(directoryName) === "directory",
		fileExists: (fileName) => host.fileTypeSync(fileName) === "file",
		getAccessibleEntries(directoryName) {
			const entries = host.readDirectorySync(directoryName);
			return {
				directories: entries
					.filter(({ type }) => type === "directory")
					.map(({ name }) => name),
				files: entries
					.filter(({ type }) => type === "file")
					.map(({ name }) => name),
			};
		},
		readFile: (fileName) => host.readFileSync(fileName) ?? null,
	};
}

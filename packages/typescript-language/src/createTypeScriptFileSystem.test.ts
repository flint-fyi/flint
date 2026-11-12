import { serverFS } from "typescript-native/fs";
import { describe, expect, it } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { createTypeScriptFileSystem } from "./createTypeScriptFileSystem.ts";
import { createVirtualFiles } from "./createVirtualFiles.ts";

describe(createTypeScriptFileSystem, () => {
	it("reads file contents and reports definite absence", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/src/index.ts", "export {};");
		const fileSystem = createTypeScriptFileSystem(host);

		expect(callback(fileSystem.readFile)("/repo/src/index.ts")).toBe(
			"export {};",
		);
		expect(callback(fileSystem.readFile)("/repo/missing.ts")).toBeUndefined();
	});

	it("reports files, directories, and accessible entries", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/src/index.ts", "export {};");
		host.vfsUpsertFile("/repo/src/nested/other.ts", "export {};");
		const fileSystem = createTypeScriptFileSystem(host);

		expect(callback(fileSystem.fileExists)("/repo/src/index.ts")).toBe(true);
		expect(callback(fileSystem.fileExists)("/repo/src")).toBe(false);
		expect(callback(fileSystem.directoryExists)("/repo/src")).toBe(true);
		expect(callback(fileSystem.directoryExists)("/repo/src/index.ts")).toBe(
			false,
		);
		expect(callback(fileSystem.getAccessibleEntries)("/repo/src")).toEqual({
			directories: ["nested"],
			files: ["index.ts"],
			symlinks: undefined,
		});
	});

	it("uses the host's normalized path handling", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/src/index.ts", "export {};");
		const fileSystem = createTypeScriptFileSystem(host);

		expect(callback(fileSystem.readFile)("/repo/src/../src/index.ts")).toBe(
			"export {};",
		);
		expect(
			callback(fileSystem.getAccessibleEntries)("/repo/src/../src/"),
		).toEqual({
			directories: [],
			files: ["index.ts"],
			symlinks: undefined,
		});
	});

	it("preserves VFS shadowing over a base host", () => {
		const baseHost = createVFSLinterHost({
			caseSensitive: true,
			cwd: "/repo",
		});
		baseHost.vfsUpsertFile("/repo/src/index.ts", "base");
		baseHost.vfsUpsertFile("/repo/src/shadowed/nested.ts", "base");
		const host = createVFSLinterHost({ baseHost });
		host.vfsUpsertFile("/repo/src/index.ts", "overlay");
		host.vfsUpsertFile("/repo/src/shadowed", "overlay file");
		const fileSystem = createTypeScriptFileSystem(host);

		expect(callback(fileSystem.readFile)("/repo/src/index.ts")).toBe("overlay");
		expect(callback(fileSystem.fileExists)("/repo/src/shadowed")).toBe(true);
		expect(callback(fileSystem.directoryExists)("/repo/src/shadowed")).toBe(
			false,
		);
		expect(callback(fileSystem.getAccessibleEntries)("/repo/src")).toEqual({
			directories: [],
			files: ["index.ts", "shadowed"],
			symlinks: undefined,
		});
	});

	it("serves only virtual files, but observes every read, for a disk-backed host", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/src/index.ts", "export {};");
		const virtualFilePath = "/repo/node_modules/overlays/tsconfig.json";
		const accessed: string[] = [];
		const fileSystem = createTypeScriptFileSystem(
			host,
			(fileName) => accessed.push(fileName),
			virtualFilesOf([[virtualFilePath, "{}"]]),
			{ diskBacked: true },
		);

		expect(fileSystem).toMatchObject({
			directoryExists: serverFS.useOS,
			fileExists: serverFS.useOS,
			getAccessibleEntries: serverFS.useOS,
		});
		expect(callback(fileSystem.readFile)(virtualFilePath)).toBe("{}");
		// TypeScript reads the disk itself for everything else.
		expect(callback(fileSystem.readFile)("/repo/src/index.ts")).toBe(
			serverFS.useOS,
		);
		expect(callback(fileSystem.readFile)("/repo/missing.ts")).toBe(
			serverFS.useOS,
		);
		expect(accessed).toEqual([
			virtualFilePath,
			"/repo/src/index.ts",
			"/repo/missing.ts",
		]);
	});

	it("does not override native realpath handling", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });

		expect(createTypeScriptFileSystem(host).realpath).toBe(serverFS.useOS);
	});

	it("synthesizes stats and ignores writes when the host is not disk-backed", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });

		expect(createTypeScriptFileSystem(host)).toMatchObject({
			removeFile: serverFS.noop,
			stat: serverFS.fakeStat,
			writeFile: serverFS.noop,
		});
	});

	it("serves host-only virtual files without mutating the host", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		const virtualFilePath = "/repo/.cache/overlay.json";
		const fileSystem = createTypeScriptFileSystem(
			host,
			undefined,
			virtualFilesOf([[virtualFilePath, '{"extends":"/repo/tsconfig.json"}']]),
		);

		expect(callback(fileSystem.fileExists)(virtualFilePath)).toBe(true);
		expect(callback(fileSystem.readFile)(virtualFilePath)).toBe(
			'{"extends":"/repo/tsconfig.json"}',
		);
		expect(host.fileTypeSync(virtualFilePath)).toBeUndefined();
		expect(host.readFileSync(virtualFilePath)).toBeUndefined();
	});

	it("serves directories implied by host-only virtual files", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		const fileSystem = createTypeScriptFileSystem(
			host,
			undefined,
			virtualFilesOf([["/repo/.cache/overlays/tsconfig.json", "{}"]]),
		);

		expect(callback(fileSystem.directoryExists)("/repo/.cache")).toBe(true);
		expect(callback(fileSystem.directoryExists)("/repo/.cache/overlays")).toBe(
			true,
		);
		expect(callback(fileSystem.getAccessibleEntries)("/repo/.cache")).toEqual({
			directories: ["overlays"],
			files: [],
			symlinks: undefined,
		});
		expect(
			callback(fileSystem.getAccessibleEntries)("/repo/.cache/overlays"),
		).toEqual({
			directories: [],
			files: ["tsconfig.json"],
			symlinks: undefined,
		});
	});
});

function callback<Result>(
	value: ((path: never) => Result) | symbol | undefined,
): (path: string) => Result {
	if (typeof value !== "function") {
		throw new TypeError("Expected a file system callback.");
	}
	return value as (path: string) => Result;
}

function virtualFilesOf(entries: [string, string][]) {
	const virtualFiles = createVirtualFiles();
	for (const [filePath, contents] of entries) {
		virtualFiles.set(filePath, contents);
	}
	return virtualFiles;
}

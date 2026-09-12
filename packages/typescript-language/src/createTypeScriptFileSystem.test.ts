import { describe, expect, it } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { createTypeScriptFileSystem } from "./createTypeScriptFileSystem.ts";

describe(createTypeScriptFileSystem, () => {
	it("reads file contents and reports definite absence", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/src/index.ts", "export {};");
		const fileSystem = createTypeScriptFileSystem(host);

		expect(fileSystem.readFile?.("/repo/src/index.ts")).toBe("export {};");
		expect(fileSystem.readFile?.("/repo/missing.ts")).toBeNull();
	});

	it("reports files, directories, and accessible entries", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/src/index.ts", "export {};");
		host.vfsUpsertFile("/repo/src/nested/other.ts", "export {};");
		const fileSystem = createTypeScriptFileSystem(host);

		expect(fileSystem.fileExists?.("/repo/src/index.ts")).toBe(true);
		expect(fileSystem.fileExists?.("/repo/src")).toBe(false);
		expect(fileSystem.directoryExists?.("/repo/src")).toBe(true);
		expect(fileSystem.directoryExists?.("/repo/src/index.ts")).toBe(false);
		expect(fileSystem.getAccessibleEntries?.("/repo/src")).toEqual({
			directories: ["nested"],
			files: ["index.ts"],
		});
	});

	it("uses the host's normalized path handling", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/src/index.ts", "export {};");
		const fileSystem = createTypeScriptFileSystem(host);

		expect(fileSystem.readFile?.("/repo/src/../src/index.ts")).toBe(
			"export {};",
		);
		expect(fileSystem.getAccessibleEntries?.("/repo/src/../src/")).toEqual({
			directories: [],
			files: ["index.ts"],
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

		expect(fileSystem.readFile?.("/repo/src/index.ts")).toBe("overlay");
		expect(fileSystem.fileExists?.("/repo/src/shadowed")).toBe(true);
		expect(fileSystem.directoryExists?.("/repo/src/shadowed")).toBe(false);
		expect(fileSystem.getAccessibleEntries?.("/repo/src")).toEqual({
			directories: [],
			files: ["index.ts", "shadowed"],
		});
	});

	it("does not override native realpath handling", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });

		expect(createTypeScriptFileSystem(host)).not.toHaveProperty("realpath");
	});

	it("serves host-only virtual files without mutating the host", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		const virtualFilePath = "/repo/.cache/overlay.json";
		const fileSystem = createTypeScriptFileSystem(
			host,
			undefined,
			new Map([[virtualFilePath, '{"extends":"/repo/tsconfig.json"}']]),
		);

		expect(fileSystem.fileExists?.(virtualFilePath)).toBe(true);
		expect(fileSystem.readFile?.(virtualFilePath)).toBe(
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
			new Map([["/repo/.cache/overlays/tsconfig.json", "{}"]]),
		);

		expect(fileSystem.directoryExists?.("/repo/.cache")).toBe(true);
		expect(fileSystem.directoryExists?.("/repo/.cache/overlays")).toBe(true);
		expect(fileSystem.getAccessibleEntries?.("/repo/.cache")).toEqual({
			directories: ["overlays"],
			files: [],
		});
		expect(fileSystem.getAccessibleEntries?.("/repo/.cache/overlays")).toEqual({
			directories: [],
			files: ["tsconfig.json"],
		});
	});
});

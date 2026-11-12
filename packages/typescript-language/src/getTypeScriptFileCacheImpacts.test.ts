import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { registerTypeScriptContentMapper } from "./contentMappers.ts";
import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";

vi.mock("./collectReferencedFilePaths.ts", () => ({
	collectReferencedFilePaths: (): string[] => [],
}));

vi.mock("./utils/containsGlobalDeclarations.ts", () => ({
	containsGlobalDeclarations: (): boolean => false,
}));

function createFile(filePathAbsolute: string): never {
	return {
		about: { filePath: filePathAbsolute, filePathAbsolute, sourceText: "" },
		services: {},
	} as never;
}

describe(getTypeScriptFileCacheImpacts, () => {
	it("depends on the nearest mapper config when a mapper names config files", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/svelte.config.js", "export default {};");
		host.vfsUpsertFile("/repo/src/Component.svelte", "");
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				configFileNames: ["svelte.config.js"],
				extensions: [".svelte"],
				packageName: "svelte-mapper",
			}),
		};

		expect(
			getTypeScriptFileCacheImpacts(
				createFile("/repo/src/Component.svelte"),
				host,
			).dependencies,
		).toEqual(["tsconfig.json", "svelte.config.js"]);
	});

	it("does not depend on a mapper config when none exists", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/src/Component.svelte", "");
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				configFileNames: ["svelte.config.js"],
				extensions: [".svelte"],
				packageName: "svelte-mapper",
			}),
		};

		expect(
			getTypeScriptFileCacheImpacts(
				createFile("/repo/src/Component.svelte"),
				host,
			).dependencies,
		).toEqual(["tsconfig.json"]);
	});
});

import { describe, expect, it } from "vitest";

import { createVFSLinterHost, type VFSLinterHost } from "@flint.fyi/core";

import { orderTypeScriptFilePaths } from "./orderTypeScriptFilePaths.ts";

describe(orderTypeScriptFilePaths, () => {
	it("orders files by referenced alternate configs", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		upsertJson(host, "/repo/packages/example/tsconfig.json", {
			files: [],
			references: [
				{ path: "./tsconfig.src.json" },
				{ path: "./tsconfig.test.json" },
			],
		});
		upsertJson(host, "/repo/packages/example/tsconfig.src.json", {
			files: ["src/index.ts"],
		});
		upsertJson(host, "/repo/packages/example/tsconfig.test.json", {
			files: ["src/index.test.ts"],
			references: [{ path: "./tsconfig.src.json" }],
		});
		host.vfsUpsertFile("/repo/packages/example/src/index.ts", "");
		host.vfsUpsertFile("/repo/packages/example/src/index.test.ts", "");

		const ordered = orderTypeScriptFilePaths(
			[
				"/repo/packages/example/src/index.test.ts",
				"/repo/packages/example/src/index.ts",
			],
			host,
		);

		expect(ordered).toEqual([
			"/repo/packages/example/src/index.ts",
			"/repo/packages/example/src/index.test.ts",
		]);
	});
});

function upsertJson(host: VFSLinterHost, filePath: string, contents: object) {
	host.vfsUpsertFile(filePath, JSON.stringify(contents));
}

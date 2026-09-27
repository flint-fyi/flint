import { describe, expect, it } from "vitest";

import { createVFSLinterHost, type VFSLinterHost } from "@flint.fyi/core";

import { orderTypeScriptFilePaths } from "./orderTypeScriptFilePaths.ts";

describe(orderTypeScriptFilePaths, () => {
	it("groups files that share a nearest config", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		upsertJson(host, "/repo/packages/one/tsconfig.json", {});
		upsertJson(host, "/repo/packages/two/tsconfig.json", {});
		host.vfsUpsertFile("/repo/packages/one/src/a.ts", "");
		host.vfsUpsertFile("/repo/packages/one/src/b.ts", "");
		host.vfsUpsertFile("/repo/packages/two/src/a.ts", "");
		host.vfsUpsertFile("/repo/packages/two/src/b.ts", "");

		const ordered = orderTypeScriptFilePaths(
			[
				"/repo/packages/two/src/a.ts",
				"/repo/packages/one/src/b.ts",
				"/repo/packages/two/src/b.ts",
				"/repo/packages/one/src/a.ts",
			],
			host,
		);

		expect(ordered).toEqual([
			"/repo/packages/one/src/a.ts",
			"/repo/packages/one/src/b.ts",
			"/repo/packages/two/src/a.ts",
			"/repo/packages/two/src/b.ts",
		]);
	});

	it("sorts files with no config after files that have one", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		upsertJson(host, "/repo/packages/one/tsconfig.json", {});
		host.vfsUpsertFile("/repo/packages/one/src/a.ts", "");
		host.vfsUpsertFile("/repo/loose.ts", "");

		const ordered = orderTypeScriptFilePaths(
			["/repo/loose.ts", "/repo/packages/one/src/a.ts"],
			host,
		);

		expect(ordered).toEqual(["/repo/packages/one/src/a.ts", "/repo/loose.ts"]);
	});

	// Ordering walks up to the nearest config rather than resolving project
	// references, so files split across a solution's referenced configs share one
	// group and fall back to path order within it.
	it("keeps referenced alternate configs in one group", () => {
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
			"/repo/packages/example/src/index.test.ts",
			"/repo/packages/example/src/index.ts",
		]);
	});
});

function upsertJson(host: VFSLinterHost, filePath: string, contents: object) {
	host.vfsUpsertFile(filePath, JSON.stringify(contents));
}

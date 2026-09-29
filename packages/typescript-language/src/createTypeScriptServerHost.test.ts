import { describe, expect, it } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";

function createHost() {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
	host.vfsUpsertFile("/repo/src/index.ts", "export {};");
	host.vfsUpsertFile("/repo/src/nested/deep/other.ts", "export {};");
	host.vfsUpsertFile("/repo/src/nested/styles.css", "");
	host.vfsUpsertFile("/repo/node_modules/dependency/index.d.ts", "export {};");
	return createTypeScriptServerHost(host);
}

describe(createTypeScriptServerHost, () => {
	it("reads directories through the linter host with TypeScript's glob semantics", () => {
		const serverHost = createHost();

		expect(
			serverHost.readDirectory("/repo", [".ts"], undefined, ["src/**/*"]),
		).toEqual(["/repo/src/index.ts", "/repo/src/nested/deep/other.ts"]);
		expect(
			serverHost.readDirectory("/repo/src", undefined, undefined, ["*.*"]),
		).toEqual(["/repo/src/index.ts"]);
		expect(
			serverHost.readDirectory("/repo/src", undefined, ["**/deep"], undefined),
		).toEqual(["/repo/src/index.ts", "/repo/src/nested/styles.css"]);
	});

	it("limits recursion to the requested depth", () => {
		const serverHost = createHost();

		expect(
			serverHost.readDirectory("/repo/src", undefined, undefined, undefined, 1),
		).toEqual(["/repo/src/index.ts"]);
	});

	it("treats missing directories as empty", () => {
		const serverHost = createHost();

		expect(
			serverHost.readDirectory("/repo/missing", undefined, undefined, ["**/*"]),
		).toEqual([]);
	});
});

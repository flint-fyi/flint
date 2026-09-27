import { describe, expect, it } from "vitest";

import { createVirtualFiles } from "./createVirtualFiles.ts";

describe(createVirtualFiles, () => {
	it("reads back a file stored under the same path", () => {
		const virtualFiles = createVirtualFiles();
		virtualFiles.set("/repo/tsconfig.json", "{}");

		expect(virtualFiles.has("/repo/tsconfig.json")).toBe(true);
		expect(virtualFiles.get("/repo/tsconfig.json")).toBe("{}");
	});

	// Overlay paths are built with Node's `path`, so they use `\` on Windows,
	// while TypeScript asks the file system for the same file using `/`.
	it("matches a backslash-spelled path against its slash-spelled entry", () => {
		const virtualFiles = createVirtualFiles();
		virtualFiles.set(String.raw`C:\repo\tsconfig.json.flint-parse.json`, "{}");

		expect(virtualFiles.has("C:/repo/tsconfig.json.flint-parse.json")).toBe(
			true,
		);
		expect(virtualFiles.get("C:/repo/tsconfig.json.flint-parse.json")).toBe(
			"{}",
		);
	});

	it("deletes an entry spelled with the other separator", () => {
		const virtualFiles = createVirtualFiles();
		virtualFiles.set(String.raw`C:\repo\overlay.json`, "{}");
		virtualFiles.delete("C:/repo/overlay.json");

		expect(virtualFiles.has(String.raw`C:\repo\overlay.json`)).toBe(false);
	});

	it("lists keys in their normalized spelling", () => {
		const virtualFiles = createVirtualFiles();
		virtualFiles.set(String.raw`C:\repo\overlay.json`, "{}");

		expect([...virtualFiles.keys()]).toEqual(["C:/repo/overlay.json"]);
	});
});

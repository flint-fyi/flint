import type * as NodeUrl from "node:url";

import { describe, expect, it, vi } from "vitest";

import { uriToFilePath } from "./uriToFilePath.ts";

vi.mock("node:url", async (importOriginal) => {
	const original = await importOriginal<typeof NodeUrl>();

	return {
		...original,
		fileURLToPath: (uri: string) =>
			original.fileURLToPath(uri, { windows: true }),
	};
});

describe(uriToFilePath, () => {
	it.each([
		"file:///C:/Users/me/@scope/a.ts",
		"file:///c:/Users/me/%40scope/a.ts",
		"file:///c%3A/Users/me/%40scope/a.ts",
	])("resolves the Windows URI %s to one file path", (uri) => {
		expect(uriToFilePath(uri)).toBe("C:/Users/me/@scope/a.ts");
	});

	it.each(["file:///missing/drive.ts", "untitled:Untitled-1"])(
		"resolves %s to no file path",
		(uri) => {
			expect(uriToFilePath(uri)).toBeUndefined();
		},
	);
});

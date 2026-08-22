import fs from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import { writeFile } from "./writeFile.ts";
import { writeStructure } from "./writeStructure.ts";

vi.mock("node:fs/promises", () => ({
	default: { mkdir: vi.fn() },
}));

vi.mock("./writeFile.ts");

describe(writeStructure, () => {
	it("returns zero and creates only the root directory when the structure is empty", async () => {
		const actual = await writeStructure("cases/case", {});

		expect({
			created: actual,
			mkdirCalls: vi.mocked(fs.mkdir).mock.calls,
			writeFileCalls: vi.mocked(writeFile).mock.calls,
		}).toEqual({
			created: 0,
			mkdirCalls: [["cases/case", { recursive: true }]],
			writeFileCalls: [],
		});
	});

	it("writes nested files and counts them when the structure has directories", async () => {
		const actual = await writeStructure("cases/case", {
			"package.json": [{ name: "case" }, "json"],
			src: {
				"index.ts": ["export {};", "typescript"],
				nested: {
					"index.ts": ["export {};", "typescript"],
				},
			},
		});

		expect({
			created: actual,
			mkdirCalls: vi.mocked(fs.mkdir).mock.calls,
			writeFileCalls: vi.mocked(writeFile).mock.calls,
		}).toEqual({
			created: 3,
			mkdirCalls: [
				["cases/case", { recursive: true }],
				["cases/case/src", { recursive: true }],
				["cases/case/src/nested", { recursive: true }],
			],
			writeFileCalls: [
				["cases/case", "package.json", { name: "case" }, "json"],
				["cases/case/src", "index.ts", "export {};", "typescript"],
				["cases/case/src/nested", "index.ts", "export {};", "typescript"],
			],
		});
	});
});

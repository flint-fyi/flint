import { describe, expect, it, vi } from "vitest";

import type { FileResults } from "@flint.fyi/core";

import {
	isStructuralFilePath,
	lintChangedFiles,
	normalizeFilePath,
	type IncrementalLintSession,
} from "./lintSessionChanges.ts";

const emptyResults: FileResults = {
	dependencies: new Set(),
	languageReports: [],
	reports: [],
};

describe(lintChangedFiles, () => {
	it("returns changed results and dependent paths for a later lint batch", async () => {
		const changedResults = new Map([["/root/a.ts", emptyResults]]);
		const lintFiles = vi
			.fn<IncrementalLintSession["lintFiles"]>()
			.mockResolvedValueOnce(changedResults);
		const session: IncrementalLintSession = {
			getTransitiveDependentsOf: vi.fn(
				() => new Set(["/root/a.ts", "/root/c.ts"]),
			),
			lintFiles,
		};

		const result = await lintChangedFiles(session, new Set(["/root/a.ts"]));

		expect(result).toEqual({
			changedResults,
			dependentFilePaths: new Set(["/root/c.ts"]),
		});
		expect(Array.from(lintFiles.mock.calls[0]?.[0] ?? [])).toEqual([
			"/root/a.ts",
		]);
		expect(lintFiles).toHaveBeenCalledTimes(1);
	});
});

describe(isStructuralFilePath, () => {
	it("detects config, package, and tsconfig changes", () => {
		expect(
			isStructuralFilePath("/workspace/flint.config.ts", "/workspace", [
				"flint.config.ts",
			]),
		).toBe(true);
		expect(
			isStructuralFilePath(
				"/workspace/packages/app/package.json",
				"/workspace",
				["flint.config.ts"],
			),
		).toBe(true);
		expect(
			isStructuralFilePath(
				"/workspace/packages/app/tsconfig.build.json",
				"/workspace",
				["flint.config.ts"],
			),
		).toBe(true);
		expect(
			isStructuralFilePath(
				"/workspace/packages/app/src/index.ts",
				"/workspace",
				["flint.config.ts"],
			),
		).toBe(false);
	});
});

describe(normalizeFilePath, () => {
	it("normalizes path separators", () => {
		expect(normalizeFilePath("C:\\workspace\\src\\index.ts")).toBe(
			"C:/workspace/src/index.ts",
		);
	});
});

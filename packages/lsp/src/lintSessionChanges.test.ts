import { describe, expect, it } from "vitest";

import {
	isStructuralFilePath,
	normalizeFilePath,
} from "./lintSessionChanges.ts";

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

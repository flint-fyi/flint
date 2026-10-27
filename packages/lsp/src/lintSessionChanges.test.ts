import { describe, expect, it } from "vitest";

import { isStructuralFilePath } from "./lintSessionChanges.ts";

describe(isStructuralFilePath, () => {
	it("detects config, package, and tsconfig changes", () => {
		expect(
			isStructuralFilePath("/workspace/flint.config.ts", "/workspace"),
		).toBe(true);
		expect(
			isStructuralFilePath(
				"/workspace/packages/app/package.json",
				"/workspace",
			),
		).toBe(true);
		expect(
			isStructuralFilePath(
				"/workspace/packages/app/tsconfig.build.json",
				"/workspace",
			),
		).toBe(true);
		expect(
			isStructuralFilePath(
				"/workspace/packages/app/src/index.ts",
				"/workspace",
			),
		).toBe(false);
	});
});

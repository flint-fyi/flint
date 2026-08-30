import { describe, expect, it } from "vitest";

import type { ProcessedConfigDefinition } from "../types/configs.ts";
import { resolveUseFilesGlobs } from "./resolveUseFilesGlobs.ts";

function createConfig(
	ignore: NonNullable<ProcessedConfigDefinition["ignore"]>,
): ProcessedConfigDefinition {
	return {
		filePath: "flint.config.ts",
		ignore,
		use: [],
	};
}

describe(resolveUseFilesGlobs, () => {
	it("treats a string ignore value as a single glob", () => {
		const result = resolveUseFilesGlobs(
			undefined,
			createConfig("src/legacy/**/*"),
		);

		expect(result).toEqual({
			exclude: ["src/legacy/**/*"],
			include: [],
		});
	});

	it("flattens nested ignore values", () => {
		const result = resolveUseFilesGlobs(
			undefined,
			createConfig(["dist/**/*", [["coverage/**/*"], ["generated/**/*"]]]),
		);

		expect(result).toEqual({
			exclude: ["dist/**/*", "coverage/**/*", "generated/**/*"],
			include: [],
		});
	});
});

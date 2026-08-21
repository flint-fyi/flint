import { describe, expect, it } from "vitest";

import { countCaseFiles, createCaseFiles } from "./createCaseFiles.ts";

describe("countCaseFiles", () => {
	it.for([2, 256, 1024])(
		"counts source files matching the requested count when files is %i",
		(files) => {
			const actual = countCaseFiles({ files, rules: 1 });

			expect(actual).toBe(files);
		},
	);
});

describe("createCaseFiles", () => {
	it("creates a config file per linter alongside src and tsconfig.json", () => {
		const actual = createCaseFiles({ files: 2, rules: 1 });

		expect(Object.keys(actual)).toEqual([
			"eslint.config.js",
			"flint.config.ts",
			"src",
			"tsconfig.json",
		]);
	});

	it("nests example directories under src when files is small", () => {
		const actual = createCaseFiles({ files: 2, rules: 1 });

		expect(Object.keys(actual.src ?? {})).toEqual(["index.ts", "example0"]);
	});
});

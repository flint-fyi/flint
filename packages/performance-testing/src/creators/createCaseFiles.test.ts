import path from "node:path";

import { describe, expect, it } from "vitest";

import type { Structure } from "../writing/writeStructure.ts";
import { countCaseFiles, createCaseFiles } from "./createCaseFiles.ts";

describe(countCaseFiles, () => {
	it.for([2, 128, 1024, 4096, 8192])(
		"counts source files matching the requested count when files is %i",
		(files) => {
			const actual = countCaseFiles({ files, rules: 1 });

			expect(actual).toBe(files);
		},
	);
});

describe(createCaseFiles, () => {
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

	it.for([2, 256, 1024])(
		"only references generated files from relative module specifiers when files is %i",
		(files) => {
			const sourceFiles = collectSourceFiles(
				createCaseFiles({ files, rules: 1 }).src as Structure,
			);

			const actual = [...sourceFiles].flatMap(([filePath, source]) =>
				Array.from(source.matchAll(/from "(\.[^"]+)"/g), ([, specifier = ""]) =>
					path.posix.join(path.posix.dirname(filePath), specifier),
				).filter((resolved) => !sourceFiles.has(resolved)),
			);

			expect(actual).toEqual([]);
		},
	);

	it("references an array in the root for-in loop when creating the root index", () => {
		const actual = (createCaseFiles({ files: 2, rules: 1 }).src as Structure)[
			"index.ts"
		];

		expect(Array.isArray(actual) && actual[0]).toContain(
			'const summaries = [await example0("")];',
		);
	});
});

function collectSourceFiles(
	structure: Structure,
	directory = "",
): Map<string, string> {
	return new Map(
		Object.entries(structure).flatMap(([name, value]) => {
			const filePath = path.posix.join(directory, name);

			return Array.isArray(value)
				? [[filePath, String(value[0])] as const]
				: [...collectSourceFiles(value, filePath)];
		}),
	);
}

import { describe, expect, it } from "vitest";

import { getFileNameError } from "./getFileNameError.ts";

describe(getFileNameError, () => {
	it.each([
		["", "Enter a file name."],
		["index", "Add a file extension."],
		["index.", "Add a file extension."],
		["my file.ts", "Use only letters, numbers, dots, dashes, and underscores."],
		["notes.txt", ".txt files aren't supported yet."],
		["tsconfig.json", "tsconfig.json is reserved by the playground."],
		["index.ts", "A file with this name already exists."],
	])("returns an error for %j", (fileName, expected) => {
		expect(getFileNameError(fileName, ["index.ts"])).toBe(expected);
	});

	it("returns undefined for a valid new file name", () => {
		expect(getFileNameError("other.ts", ["index.ts"])).toBeUndefined();
	});

	it.each([
		"",
		"data",
		"data.",
		"data.j",
		"data.js",
		"lintPlaygroundFiles.tes",
		"notes.txt",
	])(
		"skips errors that more typing might resolve for %j while typing",
		(fileName) => {
			expect(getFileNameError(fileName, [], true)).toBeUndefined();
		},
	);

	it("returns errors that more typing can't resolve while typing", () => {
		expect(getFileNameError("my file.ts", [], true)).toBe(
			"Use only letters, numbers, dots, dashes, and underscores.",
		);
	});
});

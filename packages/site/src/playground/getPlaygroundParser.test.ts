import { describe, expect, it } from "vitest";

import {
	getFileExtension,
	getPlaygroundParser,
} from "./getPlaygroundParser.ts";

describe(getFileExtension, () => {
	it.each([
		["index.ts", ".ts"],
		["index.test.ts", ".ts"],
		["index.", "."],
	])("returns the extension of %j", (fileName, expected) => {
		expect(getFileExtension(fileName)).toBe(expected);
	});

	it.each(["index", ".gitignore"])(
		"returns undefined for %j without an extension",
		(fileName) => {
			expect(getFileExtension(fileName)).toBeUndefined();
		},
	);
});

describe(getPlaygroundParser, () => {
	it.each([
		["data.json", "json"],
		["index.cjs", "typescript"],
		["index.cts", "typescript"],
		["index.js", "typescript"],
		["index.jsx", "typescript"],
		["index.mjs", "typescript"],
		["index.mts", "typescript"],
		["index.ts", "typescript"],
		["index.tsx", "typescript"],
	])("returns the parser of %j", (fileName, expected) => {
		expect(getPlaygroundParser(fileName)).toBe(expected);
	});

	it.each(["index", "notes.txt", ".ts"])(
		"returns undefined for %j without a supported extension",
		(fileName) => {
			expect(getPlaygroundParser(fileName)).toBeUndefined();
		},
	);
});

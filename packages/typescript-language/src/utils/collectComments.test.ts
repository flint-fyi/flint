import { describe, expect, it } from "vitest";

import { createNativeSourceFile } from "../test/createNativeSourceFile.testUtils.ts";
import { collectComments } from "./collectComments.ts";

describe(collectComments, () => {
	it("collects comments after a JSX attribute string when it ends in a backslash", () => {
		const sourceFile = createNativeSourceFile(
			String.raw`const element = <a b="C:\" />; // note`,
			".tsx",
		);

		expect(collectComments(sourceFile).map(({ text }) => text)).toEqual([
			"// note",
		]);
	});

	it("skips comment-like text when it is inside literals", () => {
		const sourceFile = createNativeSourceFile(
			"const text = `/* a */${'// b'}`; /* c */ const pattern = /\\/\\/d/; // e",
		);

		expect(collectComments(sourceFile).map(({ text }) => text)).toEqual([
			"/* c */",
			"// e",
		]);
	});

	it("returns the same comments when called again for the same file", () => {
		const sourceFile = createNativeSourceFile("// first\nconst value = 1;");

		expect(collectComments(sourceFile)).toBe(collectComments(sourceFile));
	});
});

import { describe, expect, it } from "vitest";

import { createSelectionMatcher } from "./createSelectionMatcher.ts";

describe(createSelectionMatcher, () => {
	it("matches the selection literally when there are no wildcards", () => {
		const matcher = createSelectionMatcher("ts/debuggerStatements");

		expect(matcher.test("ts/debuggerStatements")).toBe(true);
		expect(matcher.test("ts/debuggerStatement")).toBe(false);
	});

	it("treats * as a wildcard segment", () => {
		const matcher = createSelectionMatcher("ts/debugger*");

		expect(matcher.test("ts/debuggerStatements")).toBe(true);
		expect(matcher.test("ts/debugger")).toBe(true);
		expect(matcher.test("ts/other")).toBe(false);
	});

	it("treats regex metacharacters in the selection as literals", () => {
		const matcher = createSelectionMatcher("file.name*test");

		expect(matcher.test("file.name.test")).toBe(true);
		expect(matcher.test("file1name.test")).toBe(false);
	});
});

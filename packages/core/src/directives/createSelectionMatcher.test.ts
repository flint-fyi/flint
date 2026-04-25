import { describe, expect, it } from "vitest";

import { createSelectionMatcher } from "./createSelectionMatcher.ts";

describe(createSelectionMatcher, () => {
	it("matches the selection literally when there are no wildcards", () => {
		const matcher = createSelectionMatcher("ts/debuggerStatements");

		expect(matcher.test("ts/debuggerStatements")).toBe(true);
	});

	it("does not match a different selection when there are no wildcards", () => {
		const matcher = createSelectionMatcher("ts/debuggerStatements");

		expect(matcher.test("ts/debuggerStatement")).toBe(false);
	});

	it("treats * as a wildcard segment that matches", () => {
		const matcher = createSelectionMatcher("ts/debugger*");

		expect(matcher.test("ts/debuggerStatements")).toBe(true);
		expect(matcher.test("ts/debugger")).toBe(true);
	});

	it("treats * as a wildcard segment that does not match across prefixes", () => {
		const matcher = createSelectionMatcher("ts/debugger*");

		expect(matcher.test("ts/other")).toBe(false);
	});

	it("treats regex metacharacters in the selection as literals", () => {
		const matcher = createSelectionMatcher("file.name*test");

		expect(matcher.test("file.name.test")).toBe(true);
	});

	it("does not treat regex metacharacters as active patterns", () => {
		const matcher = createSelectionMatcher("file.name*test");

		expect(matcher.test("file1name.test")).toBe(false);
	});
});

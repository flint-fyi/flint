import { describe, expect, it } from "vitest";

import { createSelectionMatcher } from "./createSelectionMatcher.ts";

describe(createSelectionMatcher, () => {
	it("creates a matcher that matches the selection", () => {
		const actual = createSelectionMatcher("aaa/*");

		expect(actual.test("aaa/bbb")).toBe(true);
		expect(actual.test("ccc/bbb")).toBe(false);
	});

	it("returns the same matcher when called again with the same selection", () => {
		const first = createSelectionMatcher("aaa");
		const second = createSelectionMatcher("aaa");

		expect(second).toBe(first);
	});

	it("returns a different matcher when called with a different selection", () => {
		const first = createSelectionMatcher("aaa");
		const second = createSelectionMatcher("bbb");

		expect(second).not.toBe(first);
	});
});

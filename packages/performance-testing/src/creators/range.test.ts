import { describe, expect, it } from "vitest";

import { range } from "./range.ts";

describe("range", () => {
	it("returns an empty array when length is zero", () => {
		const actual = range(0, 0);

		expect(actual).toEqual([]);
	});

	it("returns values starting at start when start is zero", () => {
		const actual = range(0, 3);

		expect(actual).toEqual([0, 1, 2]);
	});

	it("returns values offset by start when start is nonzero", () => {
		const actual = range(1, 3);

		expect(actual).toEqual([1, 2, 3]);
	});
});

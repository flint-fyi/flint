import { describe, expect, it } from "vitest";

import { binarySearch, flatten } from "./arrays.ts";

describe("flatten", () => {
	it("works with plain arrays", () => {
		const array = [1];

		const result: number[] = flatten(array);

		expect(result).toEqual([1]);
	});

	it("works with super nested arrays", () => {
		const array = [[[[[[[[[[[[[[[[[[[[[[[[1]]]]]]]]]]]]]]]]]]]]]]]];

		const result: number[] = flatten(array);

		expect(result).toEqual([1]);
	});
});

describe("binarySearch", () => {
	describe("no-fallback", () => {
		it("returns undefined on empty array with", () => {
			const res = binarySearch([], () => 0);

			expect(res).toBeUndefined();
		});

		it("returns undefined when value less than first elem", () => {
			const res = binarySearch([5, 6], () => 1);

			expect(res).toBeUndefined();
		});

		it("returns undefined when value greater than last elem", () => {
			const res = binarySearch([5, 6], () => -1);

			expect(res).toBeUndefined();
		});

		it("works when value is first elem", () => {
			const res = binarySearch([5, 6], () => 0);

			expect(res).toEqual({
				element: 5,
				index: 0,
			});
		});

		it("works when value is last elem", () => {
			const res = binarySearch([5, 6], (elem) =>
				elem < 6 ? -1 : elem > 6 ? 1 : 0,
			);

			expect(res).toEqual({
				element: 6,
				index: 1,
			});
		});

		it("works when value is in the middle of array", () => {
			const res = binarySearch([5, 6, 7], (elem) =>
				elem < 6 ? -1 : elem > 6 ? 1 : 0,
			);

			expect(res).toEqual({
				element: 6,
				index: 1,
			});
		});

		it("returns undefined when value is between elements in the middle of the array", () => {
			const res = binarySearch([5, 7, 8], (elem) =>
				elem < 6 ? -1 : elem > 6 ? 1 : 0,
			);

			expect(res).toBeUndefined();
		});
	});

	describe("fallback-next", () => {
		it("returns first element when value is less than first element", () => {
			const res = binarySearch([5, 6], () => 1, "fallback-next");

			expect(res).toEqual({
				element: 5,
				index: 0,
			});
		});

		it("returns next element when value is between elements in the middle of the array", () => {
			const res = binarySearch(
				[5, 6],
				(elem) => (elem < 5.5 ? -1 : elem > 5.5 ? 1 : 0),
				"fallback-next",
			);

			expect(res).toEqual({
				element: 6,
				index: 1,
			});
		});

		it("returns undefined element when value is greater than last element", () => {
			const res = binarySearch([5, 6], () => -1, "fallback-next");

			expect(res).toEqual({
				element: undefined,
				index: 2,
			});
		});
	});

	describe("fallback-prev", () => {
		it("returns undefined element when value is less than first element", () => {
			const res = binarySearch([5, 6], () => 1, "fallback-prev");

			expect(res).toEqual({
				element: undefined,
				index: -1,
			});
		});

		it("returns prev element when value is between elements in the middle of the array", () => {
			const res = binarySearch(
				[5, 6],
				(elem) => (elem < 5.5 ? -1 : elem > 5.5 ? 1 : 0),
				"fallback-prev",
			);

			expect(res).toEqual({
				element: 5,
				index: 0,
			});
		});

		it("returns last element when value is greater than last element", () => {
			const res = binarySearch([5, 6], () => -1, "fallback-prev");

			expect(res).toEqual({
				element: 6,
				index: 1,
			});
		});
	});
});

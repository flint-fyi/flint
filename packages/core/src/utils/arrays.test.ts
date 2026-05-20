// @vitest/eslint-plugin doesn't recognize itProp.prop() as a test block.
/* eslint-disable vitest/no-standalone-expect */
import { fc, it as itProp } from "@fast-check/vitest";
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

	describe("properties", () => {
		const sortedArrayAndTarget = fc
			.tuple(
				fc.array(fc.integer({ max: 1000, min: -1000 }), { maxLength: 50 }),
				fc.integer({ max: 1000, min: -1000 }),
			)
			.map(
				([array, target]) =>
					[[...array].sort((a, b) => a - b), target] as const,
			);

		const compareFor = (target: number) => (elem: number) =>
			elem < target ? -1 : elem > target ? 1 : 0;

		itProp.prop([sortedArrayAndTarget])(
			"no-fallback matches the array when target is present",
			([array, target]) => {
				const res = binarySearch(array, compareFor(target));
				const expectedIndex = array.indexOf(target);
				const expected =
					expectedIndex === -1
						? undefined
						: { element: target, index: expectedIndex };

				expect(res).toEqual(expected);
			},
		);

		itProp.prop([sortedArrayAndTarget])(
			"fallback-prev returns the rightmost element ≤ target",
			([array, target]) => {
				const res = binarySearch(array, compareFor(target), "fallback-prev");
				let expectedIndex = -1;
				for (const [index, element] of array.entries()) {
					if (element <= target) {
						expectedIndex = index;
					} else {
						break;
					}
				}

				expect(res).toEqual({
					element: array[expectedIndex],
					index: expectedIndex,
				});
			},
		);

		itProp.prop([sortedArrayAndTarget])(
			"fallback-next returns the leftmost element ≥ target",
			([array, target]) => {
				const res = binarySearch(array, compareFor(target), "fallback-next");
				let expectedIndex = array.length;
				for (const [index, element] of array.entries()) {
					if (element >= target) {
						expectedIndex = index;
						break;
					}
				}

				expect(res).toEqual({
					element: array[expectedIndex],
					index: expectedIndex,
				});
			},
		);
	});
});

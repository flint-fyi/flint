import { nullThrows } from "@flint.fyi/utils";

import type { AnyLevelDeep } from "../types/arrays.ts";

type Flatten<T> = T extends unknown[] ? Flatten<T[number]> : T[];

export function flatten<T>(values: AnyLevelDeep<T>): Flatten<T> {
	if (!Array.isArray(values)) {
		return [values] as Flatten<T>;
	}

	return values.flat(
		// When using Infinity, TS’s native flattening errors with:
		// Type instantiation is excessively deep and possibly infinite.
		Infinity as 0,
	) as Flatten<T>;
}

/**
 * Performs a binary search on a sorted array.
 * @param array A sorted array to search.
 * @param compare A callback that returns -1 if `elem` < target, 0 if `elem` === target,
 * and 1 if `elem` > target.
 * @param fallbackBehavior Controls what happens when no exact match is found.
 * @returns The `{ index, element }` if an exact match is found. If no match is found:
 * - with `no-fallback`: `undefined`
 * - with `fallback-next`: `{ index, element }` for the next greater element,
 * or `undefined` if target is past end
 * - with `fallback-prev`: `{ index, element }` for the previous smaller element,
 * or `undefined` if target is before start
 */
export function binarySearch<T>(
	array: readonly T[],
	compare: (elem: T) => number,
	fallbackBehavior?: "no-fallback",
): undefined | { element: T; index: number };
export function binarySearch<T>(
	array: readonly T[],
	compare: (elem: T) => number,
	fallbackBehavior: "fallback-next" | "fallback-prev",
): { element: T | undefined; index: number };
export function binarySearch<T>(
	array: readonly T[],
	compare: (elem: T) => number,
	fallbackBehavior:
		| "fallback-next"
		| "fallback-prev"
		| "no-fallback" = "no-fallback",
): undefined | { element: T | undefined; index: number } {
	let low = 0;
	let high = array.length - 1;
	while (low <= high) {
		const mid = low + ((high - low) >> 1);
		const res = compare(
			nullThrows(
				array[mid],
				"Element is expected to be present by the loop condition",
			),
		);
		if (res < 0) {
			low = mid + 1;
		} else if (res > 0) {
			high = mid - 1;
		} else {
			return {
				element: array[mid],
				index: mid,
			};
		}
	}

	if (fallbackBehavior === "no-fallback") {
		return undefined;
	} else if (fallbackBehavior === "fallback-prev") {
		low -= 1;
	}

	return {
		element: array[low],
		index: low,
	};
}

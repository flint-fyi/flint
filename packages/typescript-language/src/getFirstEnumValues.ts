/**
 * Removes TypeScript enum values that alias earlier values.
 * @param original Any TypeScript enum with numeric values.
 * @returns A version of the enum with only the first occurrence of each value.
 * @example
 * Given the following enum:
 * ```ts
 * enum Example {
 *   A = 1,
 *   B = 2,
 *   C = A
 * }
 * ```
 * Its original value looks like:
 * ```ts
 * {
 *   1: 'C', // <-- Points to 'C', the alias of 'A'
 *   2: 'B',
 *   A: 1,
 *   B: 2,
 *   C: 1,
 * }
 * ```
 * Calling `getFirstEnumValues(Example)` would return:
 * ```ts
 * {
 *   1: 'A', // <-- Corrected to the original 'A'
 *   2: 'B',
 *   A: 1,
 *   B: 2,
 *   C: 1,
 * }
 * ```
 */
export function getFirstEnumValues<
	Keys extends string,
	Values extends number,
	Original extends Record<Keys | Values, Keys | Values>,
>(original: Original) {
	const result = {} as Original;

	for (const key in original) {
		if (typeof original[key] !== "number") {
			continue;
		}

		if (!(key in result)) {
			result[key] = original[key];
		}

		if (!(original[key] in result)) {
			// 🤷 enums are tricky to type.
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
			result[original[key]] = key as any;
		}
	}

	return result;
}

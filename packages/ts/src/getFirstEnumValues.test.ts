import { describe, expect, it } from "vitest";

import { getFirstEnumValues } from "./getFirstEnumValues.ts";

describe("getFirstEnumValues", () => {
	it("returns an empty object when given an empty enum", () => {
		enum Empty {}

		const result = getFirstEnumValues(Empty);

		expect(result).toEqual({});
	});

	it("returns all original pairs when when given a non-repeating enum", () => {
		enum NonRepeating {
			A = 1,
			B = 2,
			C = 3,
		}

		const result = getFirstEnumValues(NonRepeating);

		expect(result).toEqual({
			1: "A",
			2: "B",
			3: "C",
			A: 1,
			B: 2,
			C: 3,
		});
	});

	it("returns the first key when when given a repeating-value enum", () => {
		enum Repeating {
			A = 1,
			B = 2,
			// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
			C = A,
		}

		const result = getFirstEnumValues(Repeating);

		expect(result).toEqual({
			1: "A",
			2: "B",
			A: 1,
			B: 2,
			C: 1,
		});
	});
});

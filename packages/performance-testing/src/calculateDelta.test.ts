import { describe, expect, it } from "vitest";

import { calculateDelta } from "./calculateDelta.ts";

describe(calculateDelta, () => {
	it.each([
		["1.031 s ± 0.124 s", "909.4 ms ± 120.7 ms", "-11.8%"],
		["1.049 s ± 0.058 s", "836.9 ms ± 50.4 ms", "-20.2%"],
		["500.0 ms ± 10.0 ms", "550.0 ms ± 10.0 ms", "+10.0%"],
	])("compares %s to %s as %s", (eslint, flint, expected) => {
		expect(calculateDelta(eslint, flint)).toBe(expected);
	});
});

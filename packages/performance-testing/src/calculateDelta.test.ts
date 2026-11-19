import { describe, expect, it } from "vitest";

import { calculateDelta } from "./calculateDelta.ts";

describe(calculateDelta, () => {
	it.each([
		[1.031, 0.9094, "-11.8%"],
		[1.049, 0.8369, "-20.2%"],
		[0.5, 0.55, "+10.0%"],
		[0.5, 0.5, "0.0%"],
	])("compares %s to %s as %s", (baseline, candidate, expected) => {
		expect(calculateDelta(baseline, candidate)).toBe(expected);
	});
});

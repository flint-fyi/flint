import { describe, expect, it } from "vitest";

import { formatMemory, formatTime } from "./formatMeasurement.ts";

describe(formatMemory, () => {
	it("formats bytes as mebibytes when given a deviation", () => {
		expect(formatMemory({ mean: 536_870_912, stddev: 2_097_152 })).toBe(
			"512 MiB ± 2 MiB",
		);
	});

	it("formats no deviation when there was a single run", () => {
		expect(formatMemory({ mean: 1_048_576, stddev: undefined })).toBe(
			"1 MiB ± 0 MiB",
		);
	});
});

describe(formatTime, () => {
	it("formats milliseconds when the mean is under a second", () => {
		expect(formatTime({ mean: 0.3316, stddev: 0.0177 })).toBe(
			"331.6 ms ± 17.7 ms",
		);
	});

	it("formats seconds when the mean is at least a second", () => {
		expect(formatTime({ mean: 1.428, stddev: 0.01 })).toBe("1.428 s ± 0.010 s");
	});
});

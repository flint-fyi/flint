import { describe, expect, it } from "vitest";

import { summarizeHyperfine } from "./summarizeHyperfine.ts";

describe(summarizeHyperfine, () => {
	it("converts schema 2 summaries without rounding the comparison input", () => {
		expect(
			summarizeHyperfine(
				JSON.stringify({
					results: [
						{
							summary: {
								memory_peak_resident: {
									mean: 131_072_000,
									stddev: 1_572_864,
									unit: "byte",
								},
								time_wall_clock: {
									mean: 1_234_567e-6,
									stddev: 0.0123,
									unit: "second",
								},
							},
						},
					],
					schema_version: 2,
				}),
			),
		).toEqual({
			meanSeconds: 1_234_567e-6,
			memory: "125.0 MiB ± 1.5 MiB",
			time: "1234.6 ms ± 12.3 ms",
		});
	});

	it("reports unavailable memory and omits unavailable standard deviation", () => {
		expect(
			summarizeHyperfine(
				JSON.stringify({
					results: [
						{
							summary: {
								time_wall_clock: { mean: 0.5, stddev: null, unit: "second" },
							},
						},
					],
					schema_version: 2,
				}),
			),
		).toEqual({ meanSeconds: 0.5, memory: "unavailable", time: "500.0 ms" });
	});

	it("rejects schema 1 rather than interpreting terminal output", () => {
		expect(() => summarizeHyperfine('{"results":[{"mean":1}]}')).toThrow(
			"schema_version",
		);
	});

	it("rejects a nonnumeric metric mean", () => {
		expect(() =>
			summarizeHyperfine(
				JSON.stringify({
					results: [
						{
							summary: {
								time_wall_clock: { mean: "0.5", stddev: null, unit: "second" },
							},
						},
					],
					schema_version: 2,
				}),
			),
		).toThrow("mean");
	});

	it("rejects unexpected units", () => {
		expect(() =>
			summarizeHyperfine(
				JSON.stringify({
					results: [
						{
							summary: {
								time_wall_clock: { mean: 500, stddev: 1, unit: "ms" },
							},
						},
					],
					schema_version: 2,
				}),
			),
		).toThrow("unit");
	});
});

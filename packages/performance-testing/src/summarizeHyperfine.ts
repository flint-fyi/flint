import z from "zod/v4";

import { jsonCodec } from "@flint.fyi/core";

export interface HyperfineSummary {
	meanSeconds: number;
	memory: string;
	time: string;
}

const metricSummary = z.object({
	mean: z.number(),
	stddev: z.number().nullable(),
});

const hyperfineResult = jsonCodec(
	z.object({
		results: z.tuple([
			z.object({
				summary: z.object({
					memory_peak_resident: metricSummary
						.extend({ unit: z.literal("byte") })
						.optional(),
					time_wall_clock: metricSummary.extend({ unit: z.literal("second") }),
				}),
			}),
		]),
		schema_version: z.literal(2),
	}),
);

const numberFormat = new Intl.NumberFormat("en", {
	maximumFractionDigits: 1,
	minimumFractionDigits: 1,
	useGrouping: false,
});

export function summarizeHyperfine(json: string): HyperfineSummary {
	const { memory_peak_resident: memory, time_wall_clock: time } =
		hyperfineResult.decode(json).results[0].summary;

	return {
		meanSeconds: time.mean,
		memory: memory ? formatMetric(memory, 1 / 1024 ** 2, "MiB") : "unavailable",
		time: formatMetric(time, 1000, "ms"),
	};
}

function formatMetric(
	metric: z.infer<typeof metricSummary>,
	scale: number,
	unit: string,
): string {
	return `${numberFormat.format(metric.mean * scale)} ${unit}${
		metric.stddev === null
			? ""
			: ` ± ${numberFormat.format(metric.stddev * scale)} ${unit}`
	}`;
}

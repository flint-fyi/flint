export interface HyperfineSummary {
	meanSeconds: number;
	memory: string;
	time: string;
}

interface MetricSummary {
	mean: number;
	stddev: null | number;
	unit: string;
}

export function summarizeHyperfine(json: string): HyperfineSummary {
	const data = JSON.parse(json) as {
		results: {
			summary: {
				memory_peak_resident?: MetricSummary;
				time_wall_clock: MetricSummary;
			};
		}[];
		schema_version: number;
	};
	const result = data.results[0];
	if (data.schema_version !== 2 || data.results.length !== 1 || !result) {
		throw new Error("Expected one Hyperfine schema version 2 result.");
	}

	const { memory_peak_resident: memory, time_wall_clock: time } =
		result.summary;
	if (time.unit !== "second" || (memory && memory.unit !== "byte")) {
		throw new Error("Expected Hyperfine time in seconds and memory in bytes.");
	}

	return {
		meanSeconds: time.mean,
		memory: memory ? formatMetric(memory, 1 / 1024 ** 2, "MiB") : "unavailable",
		time: formatMetric(time, 1000, "ms"),
	};
}

function formatMetric(
	metric: MetricSummary,
	scale: number,
	unit: string,
): string {
	return `${(metric.mean * scale).toFixed(1)} ${unit}${
		metric.stddev === null
			? ""
			: ` ± ${(metric.stddev * scale).toFixed(1)} ${unit}`
	}`;
}

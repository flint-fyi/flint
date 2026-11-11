import type { Summary } from "./runInHyperfine.ts";

const bytesPerMebibyte = 1024 * 1024;

export function formatMemory({ mean, stddev = 0 }: Summary): string {
	return `${(mean / bytesPerMebibyte).toFixed(0)} MiB ± ${(stddev / bytesPerMebibyte).toFixed(0)} MiB`;
}

export function formatTime({ mean, stddev = 0 }: Summary): string {
	return mean < 1
		? `${(mean * 1000).toFixed(1)} ms ± ${(stddev * 1000).toFixed(1)} ms`
		: `${mean.toFixed(3)} s ± ${stddev.toFixed(3)} s`;
}

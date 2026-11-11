export function calculateDelta(baseline: number, measured: number): string {
	const delta = ((measured - baseline) / baseline) * 100;

	return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

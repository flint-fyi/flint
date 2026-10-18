export function calculateDelta(eslint: number, flint: number): string {
	const delta = ((flint - eslint) / eslint) * 100;

	return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

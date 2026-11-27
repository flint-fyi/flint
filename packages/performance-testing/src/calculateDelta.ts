const formatPercent = new Intl.NumberFormat("en", {
	maximumFractionDigits: 1,
	minimumFractionDigits: 1,
	signDisplay: "exceptZero",
	style: "percent",
});

export function calculateDelta(baseline: number, candidate: number): string {
	return formatPercent.format((candidate - baseline) / baseline);
}

function parseDuration(result: string) {
	const match = /^([0-9.]+)\s+(m?s)/.exec(result);
	if (!match) {
		throw new Error(`Could not parse Hyperfine result: ${result}`);
	}

	const duration = Number(match[1]);
	return match[2] === "s" ? duration * 1000 : duration;
}

export function calculateDelta(eslint: string, flint: string): string {
	const eslintDuration = parseDuration(eslint);
	const delta =
		((parseDuration(flint) - eslintDuration) / eslintDuration) * 100;

	return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

export function debug(value: unknown): void {
	debugger;
	console.log(value);
}

export function calculate(a: number, b: number): number {
	JSON.stringify({ a, b });
	JSON.parse("{}");
	return a + b;
}

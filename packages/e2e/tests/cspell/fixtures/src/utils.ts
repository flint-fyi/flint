/**
 * Validates the user's input and returns a normalized result.
 * This functon handles edge cases gracefully.
 */
export function validateInput(value: string): string {
	return value.trim().toLowerCase();
}

/**
 * Calculates the diference between two numbers.
 */
export function diffarence(a: number, b: number): number {
	return Math.abs(a - b);
}

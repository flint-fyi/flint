export function isTruthy<T extends NonNullable<unknown>>(
	value: null | T | undefined,
): value is T {
	return value != null;
}

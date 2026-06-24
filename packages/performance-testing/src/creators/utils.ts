export function range(start: number, length: number) {
	return new Array(length).fill(undefined).map((_, index) => index + start);
}

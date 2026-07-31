export function createState<T>(
	initial: T,
): readonly [() => T, (updated: T) => boolean] {
	let current = initial;

	return [
		() => current,
		(updated: T) => {
			if (current === updated) {
				return false;
			}

			current = updated;
			return true;
		},
	] as const;
}

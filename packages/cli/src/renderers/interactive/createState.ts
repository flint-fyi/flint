export type State<T> = readonly [() => T, (updated: T) => boolean];

export function createState<T>(initial: T): State<T> {
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

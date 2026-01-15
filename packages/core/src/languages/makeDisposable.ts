export function makeDisposable<T extends object>(obj: T): Disposable & T {
	return {
		...obj,
		[Symbol.dispose]: () => () => {
			// Intentionally empty to satisfy the Disposable interface.
		},
	};
}

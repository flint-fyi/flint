export function makeDisposable<T extends object>(obj: T): Disposable & T {
	return {
		[Symbol.dispose]: () => () => {
			// Intentionally empty to satisfy the Disposable interface.
		},
		...obj,
	};
}

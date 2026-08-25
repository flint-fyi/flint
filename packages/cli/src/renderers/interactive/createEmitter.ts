export interface Emitter {
	add(callback: () => void): void;
	call(): void;
}

export function createEmitter(): Emitter {
	const callbacks = new Set<() => void>();

	return {
		add(callback: () => void) {
			callbacks.add(callback);
		},
		call() {
			for (const callback of callbacks) {
				callback();
			}
		},
	};
}

/**
 * Minimal browser shim for `node:async_hooks`. Flint's `runLintRule` uses
 * `AsyncLocalStorage` to thread the current file through visitor calls — but
 * in practice all runs happen synchronously inside `fileStorage.run(...)`, so
 * a stack-based fallback is sufficient.
 */

export class AsyncLocalStorage<T> {
	#stack: T[] = [];

	disable(): void {
		this.#stack = [];
	}

	enterWith(store: T): void {
		this.#stack.push(store);
	}

	exit<R>(callback: () => R): R {
		const popped = this.#stack.pop();
		try {
			return callback();
		} finally {
			if (popped !== undefined) {
				this.#stack.push(popped);
			}
		}
	}

	getStore(): T | undefined {
		// This shim only runs inside the browser worker — `Array.prototype.at`
		// is supported there since 2021. The Node-engines lint rule fires
		// because the package metadata still advertises `>=16.0.0`, but
		// nothing in this file ever reaches Node.
		// eslint-disable-next-line n/no-unsupported-features/es-syntax
		return this.#stack.at(-1);
	}

	run<R>(store: T, callback: () => R): R {
		this.#stack.push(store);
		try {
			return callback();
		} finally {
			this.#stack.pop();
		}
	}
}

export default { AsyncLocalStorage };

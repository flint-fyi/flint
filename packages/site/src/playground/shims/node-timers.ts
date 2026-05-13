/**
 * Browser shim for `node:timers`. Browsers expose all of these as globals.
 */

export const setTimeout: typeof globalThis.setTimeout = globalThis.setTimeout;
export const clearTimeout: typeof globalThis.clearTimeout =
	globalThis.clearTimeout;
export const setInterval: typeof globalThis.setInterval =
	globalThis.setInterval;
export const clearInterval: typeof globalThis.clearInterval =
	globalThis.clearInterval;

// Workers don't have setImmediate. Approximate with a minimal-delay timeout.
export function setImmediate(callback: (...args: unknown[]) => void): unknown {
	return globalThis.setTimeout(callback, 0);
}

export function clearImmediate(id: unknown): void {
	if (typeof id === "number") {
		globalThis.clearTimeout(id);
	}
}

const timers = {
	clearImmediate,
	clearInterval,
	clearTimeout,
	setImmediate,
	setInterval,
	setTimeout,
};

export default timers;

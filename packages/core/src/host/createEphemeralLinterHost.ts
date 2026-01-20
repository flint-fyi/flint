import type { LinterHost } from "../types/host.ts";

/**
 * Creates a one-shot `LinterHost` that disables file/directory watching.
 *
 * Useful for single-run linting (e.g. CLI execution, rule tester),
 * where persistent watchers are unnecessary and can affect performance.
 */
export function createEphemeralLinterHost(baseHost: LinterHost): LinterHost {
	return {
		...baseHost,
		watchDirectory() {
			return {
				[Symbol.dispose]() {
					// Intentionally empty to satisfy the Disposable interface.
				},
			};
		},
		watchFile() {
			return {
				[Symbol.dispose]() {
					// Intentionally empty to satisfy the Disposable interface.
				},
			};
		},
	};
}

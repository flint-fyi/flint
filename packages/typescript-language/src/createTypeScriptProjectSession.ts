import { API, type Snapshot } from "typescript-native/unstable/sync";

import type { LinterHost } from "@flint.fyi/core";

import { createTypeScriptFileSystem } from "./createTypeScriptFileSystem.ts";

export interface TypeScriptProjectChanges {
	changed?: string[];
	created?: string[];
	deleted?: string[];
	openFiles?: string[];
	openProjects?: string[];
}

export interface TypeScriptProjectSession extends Disposable {
	getSnapshot(): Snapshot;
	update(changes: TypeScriptProjectChanges): Snapshot;
}

export function createTypeScriptProjectSession(
	host: LinterHost,
): TypeScriptProjectSession {
	const api = new API({
		cwd: host.getCurrentDirectory(),
		fs: createTypeScriptFileSystem(host),
		runExternalCode: true,
	});
	let snapshot: Snapshot;
	try {
		snapshot = api.updateSnapshot();
	} catch (error) {
		try {
			api.close();
		} catch (closeError) {
			throw aggregateCleanupFailures(
				error,
				closeError,
				"TypeScript project session initialization failed to clean up.",
			);
		}
		throw error;
	}
	let disposed = false;
	const assertActive = (): void => {
		if (disposed) {
			throw new Error("TypeScript project session has been disposed.");
		}
	};
	const closeApi = (): undefined | { error: unknown } => {
		try {
			api.close();
		} catch (error) {
			return { error };
		}
	};
	const dispose = (): void => {
		if (disposed) {
			return;
		}

		disposed = true;
		let snapshotDisposalFailed = false;
		let snapshotDisposalError: unknown;
		try {
			snapshot.dispose();
		} catch (error) {
			snapshotDisposalFailed = true;
			snapshotDisposalError = error;
		}
		const closeFailure = closeApi();
		if (snapshotDisposalFailed && closeFailure) {
			throw new AggregateError(
				[snapshotDisposalError, closeFailure.error],
				"TypeScript project session failed to dispose.",
				{ cause: snapshotDisposalError },
			);
		}
		if (snapshotDisposalFailed) {
			throw snapshotDisposalError;
		}
		if (closeFailure) {
			throw closeFailure.error;
		}
	};
	const disposeForFailure = (): undefined | { error: unknown } => {
		try {
			dispose();
		} catch (error) {
			return { error };
		}
	};

	return {
		getSnapshot() {
			assertActive();
			return snapshot;
		},
		[Symbol.dispose]: dispose,
		update({ changed, created, deleted, openFiles, openProjects }) {
			assertActive();
			const previousSnapshot = snapshot;
			snapshot = api.updateSnapshot({
				fileChanges: {
					...(changed && { changed }),
					...(created && { created }),
					...(deleted && { deleted }),
				},
				...(openFiles && { openFiles }),
				...(openProjects && { openProjects }),
			});
			try {
				previousSnapshot.dispose();
			} catch (error) {
				const disposalFailure = disposeForFailure();
				if (disposalFailure) {
					throw aggregateCleanupFailures(
						error,
						disposalFailure.error,
						"TypeScript project session failed to dispose replaced snapshots.",
					);
				}
				throw error;
			}
			return snapshot;
		},
	};
}

function aggregateCleanupFailures(
	initialError: unknown,
	cleanupError: unknown,
	message: string,
): AggregateError {
	const cleanupErrors: unknown[] =
		cleanupError instanceof AggregateError
			? Array.from<unknown>(cleanupError.errors)
			: [cleanupError];
	return new AggregateError([initialError, ...cleanupErrors], message, {
		cause: initialError,
	});
}

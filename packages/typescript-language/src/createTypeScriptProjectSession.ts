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
		api.close();
		throw error;
	}
	let disposed = false;

	return {
		getSnapshot: () => snapshot,
		[Symbol.dispose]() {
			if (disposed) {
				return;
			}

			disposed = true;
			try {
				snapshot.dispose();
			} finally {
				api.close();
			}
		},
		update({ changed, created, deleted, openFiles, openProjects }) {
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
			previousSnapshot.dispose();
			return snapshot;
		},
	};
}

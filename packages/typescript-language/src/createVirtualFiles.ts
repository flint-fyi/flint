import { normalizePath } from "@flint.fyi/utils";

/**
 * In-memory file contents overlaid onto the linter host for TypeScript.
 *
 * Paths are keyed normalized because the two sides spell them differently on
 * Windows: overlay paths are built with Node's `path`, which uses `\`, while
 * TypeScript asks the file system for the same file using `/`.
 */
export interface VirtualFiles {
	delete: (filePath: string) => void;
	get: (filePath: string) => string | undefined;
	has: (filePath: string) => boolean;
	keys: () => Iterable<string>;
	set: (filePath: string, contents: string) => void;
}

export function createVirtualFiles(): VirtualFiles {
	const contentsByPath = new Map<string, string>();
	return {
		delete: (filePath) => {
			contentsByPath.delete(normalizePath(filePath));
		},
		get: (filePath) => contentsByPath.get(normalizePath(filePath)),
		has: (filePath) => contentsByPath.has(normalizePath(filePath)),
		keys: () => contentsByPath.keys(),
		set: (filePath, contents) => {
			contentsByPath.set(normalizePath(filePath), contents);
		},
	};
}

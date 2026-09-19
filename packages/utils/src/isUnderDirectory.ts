import * as path from "node:path";

const BACKSLASH = 92;
const SLASH = 47;

/**
 * Whether `candidate` is `directory` itself or a path nested inside it.
 *
 * Falls back to `path.relative` rather than relying on string prefixing alone:
 * on Windows, `path.resolve`-produced paths use `\` while paths that come back
 * from TypeScript are `/`-normalized, so the two can name one directory
 * differently.
 */
export function isUnderDirectory(
	directory: string,
	candidate: string,
): boolean {
	// This runs once per file of a parsed config, so take the common case —
	// both sides spelled the same way — without building a relative path.
	if (candidate.startsWith(directory)) {
		const next = candidate.charCodeAt(directory.length);
		if (Number.isNaN(next) || next === SLASH || next === BACKSLASH) {
			return true;
		}
	}
	return getPathInsideDirectory(directory, candidate) !== undefined;
}

/**
 * The path of `candidate` relative to `directory`, or `undefined` if
 * `candidate` sits outside `directory`.
 *
 * `candidate` being `directory` itself yields `""`, so callers that mean
 * "strictly inside" should test the result for truthiness rather than for
 * `undefined`.
 */
export function getPathInsideDirectory(
	directory: string,
	candidate: string,
): string | undefined {
	const relative = path.relative(directory, candidate);
	return relative === ".." ||
		relative.startsWith(`..${path.sep}`) ||
		path.isAbsolute(relative)
		? undefined
		: relative;
}

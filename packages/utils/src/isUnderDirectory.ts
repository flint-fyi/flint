import * as path from "node:path";

/**
 * Whether `candidate` is `directory` itself or a path nested inside it.
 *
 * Compares with `path.relative` rather than string prefixing: on Windows,
 * `path.resolve`-produced paths use `\` while paths that come back from
 * TypeScript are `/`-normalized, so a `startsWith(`${directory}/`)` check
 * would never match.
 */
export function isUnderDirectory(
	directory: string,
	candidate: string,
): boolean {
	return getPathInsideDirectory(directory, candidate) !== undefined;
}

/**
 * The path of `candidate` relative to `directory`, or `undefined` if
 * `candidate` is `directory` itself or sits outside it.
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

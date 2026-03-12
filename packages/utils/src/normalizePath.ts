import { normalize } from "node:path";

declare const PathKeyBrand: unique symbol;

/**
 * A branded string type used as a case-aware key for Map/Set lookups.
 * On case-insensitive file systems, this is lowercased; on case-sensitive
 * ones, it preserves case. Should never be used as an actual file path.
 */
export type PathKey = string & { readonly [PathKeyBrand]: true };

/**
 * Creates a {@link PathKey} with a trailing slash for directory prefix
 * matching. {@link pathKey} normalizes internally, which strips trailing
 * slashes, so we append one after to enable `startsWith` checks against
 * file keys.
 */
export function dirnameKey(path: string, caseSensitiveFS: boolean): PathKey {
	return (pathKey(path, caseSensitiveFS) + "/") as PathKey;
}

export function normalizeDirname(path: string) {
	const lastSlashIdx = path.lastIndexOf("/");
	path = path.slice(0, lastSlashIdx + 1);
	if (path.indexOf("/") === lastSlashIdx && path.endsWith("/")) {
		return path;
	}
	return path.slice(0, lastSlashIdx);
}

export function normalizePath(path: string): string {
	let result = normalize(path).replaceAll("\\", "/");
	if (result.indexOf("/") !== result.lastIndexOf("/") && result.endsWith("/")) {
		result = result.slice(0, -1);
	}
	return result;
}

export function pathKey(path: string, caseSensitiveFS: boolean): PathKey {
	const norm = normalizePath(path);
	return (caseSensitiveFS ? norm : norm.toLowerCase()) as PathKey;
}

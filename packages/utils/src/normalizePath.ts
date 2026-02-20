import { normalize } from "node:path";

export function normalizedDirname(path: string) {
	const lastSlashIdx = path.lastIndexOf("/");
	path = path.slice(0, lastSlashIdx + 1);
	if (path.indexOf("/") === lastSlashIdx && path.endsWith("/")) {
		return path;
	}
	return path.slice(0, lastSlashIdx);
}

export function normalizePath(path: string, caseSensitiveFS: boolean): string {
	let result = normalize(path).replaceAll("\\", "/");
	if (result.indexOf("/") !== result.lastIndexOf("/") && result.endsWith("/")) {
		result = result.slice(0, -1);
	}
	if (!caseSensitiveFS) {
		result = result.toLowerCase();
	}
	return result;
}

/**
 * Browser shim for `debug-for-file`. Real package depends on `import.meta.filename`
 * (Node-only) and `read-package-up` (filesystem walk), neither of which exist in
 * the playground worker context. We don't need debug logs in the browser, so
 * return a no-op debugger.
 */

type Debugger = (...args: unknown[]) => void;

export function debugForFile(_filePath?: string): Debugger {
	return () => {};
}

export function filePathToNamespace(): string {
	return "";
}

export function generateNamespace(): string {
	return "";
}

export default debugForFile;

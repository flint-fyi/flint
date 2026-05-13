/**
 * Browser shim for `debug-for-file`. Real package depends on `import.meta.filename`
 * (Node-only) and `read-package-up` (filesystem walk), neither of which exist in
 * the playground worker context. We don't need debug logs in the browser, so
 * return a no-op debugger.
 */

type Debugger = (...args: unknown[]) => void;

const noopDebugger: Debugger = () => {
	// Intentionally empty: debug() namespaces aren't useful in browser workers.
};

export function debugForFile(): Debugger {
	return noopDebugger;
}

export function filePathToNamespace(): string {
	return "";
}

export function generateNamespace(): string {
	return "";
}

export default debugForFile;

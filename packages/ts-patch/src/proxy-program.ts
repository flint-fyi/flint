import type { createProgram } from "typescript";

// We store extras in globalThis rather than in a local module-level variable,
// to make it work in Vitest
const globalTyped = globalThis as typeof globalThis & {
	_flintCreateProgramProxies: Set<
		(
			ts: typeof import("typescript"),
			create: typeof createProgram,
		) => typeof createProgram
	>;
	_flintExtraSupportedExtensions: Set<string>;
};
// Since it's not possible to change the module graph evaluation order,
// we store proxies unordered.
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
globalTyped._flintCreateProgramProxies ??= new Set();
globalTyped._flintExtraSupportedExtensions ??= new Set();
/* eslint-enable @typescript-eslint/no-unnecessary-condition */

export function setTSExtraSupportedExtensions(extensions: string[]) {
	for (const ext of extensions) {
		globalTyped._flintExtraSupportedExtensions.add(ext);
	}
	return () => {
		for (const ext of extensions) {
			globalTyped._flintExtraSupportedExtensions.delete(ext);
		}
	};
}

export function setTSProgramCreationProxy(
	proxy: (
		ts: typeof import("typescript"),
		create: typeof createProgram,
	) => typeof createProgram,
) {
	globalTyped._flintCreateProgramProxies.add(proxy);

	return () => globalTyped._flintCreateProgramProxies.delete(proxy);
}

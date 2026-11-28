import type ts from "typescript";

// We store extras in globalThis rather than in a local module-level variable,
// to make it work in Vitest
const globalTyped = globalThis as typeof globalThis & {
	_flintCreateProgramProxies: Set<
		(
			typescript: typeof ts,
			create: typeof ts.createProgram,
		) => typeof ts.createProgram
	>;
	_flintExtraSupportedExtensions: Set<string>;
	_flintScriptKindProviders: Set<ScriptKindProvider>;
};
// Since it's not possible to change the module graph evaluation order,
// we store proxies unordered.
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
globalTyped._flintCreateProgramProxies ??= new Set();
globalTyped._flintExtraSupportedExtensions ??= new Set();
globalTyped._flintScriptKindProviders ??= new Set();
/* eslint-enable @typescript-eslint/no-unnecessary-condition */

type ScriptKindProvider = (
	fileName: string,
	host: ts.LanguageServiceHost,
) => ts.ScriptKind | undefined;

export function setTSExtraSupportedExtensions(
	extensions: string[],
): () => void {
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
		typescript: typeof ts,
		create: typeof ts.createProgram,
	) => typeof ts.createProgram,
): () => boolean {
	globalTyped._flintCreateProgramProxies.add(proxy);

	return () => globalTyped._flintCreateProgramProxies.delete(proxy);
}

/**
 * Overrides the script kind language services read from their host,
 * the way Volar.js's `decorateLanguageServiceHost` overrides `getScriptKind`.
 * Returning `undefined` falls back to the host.
 */
export function setTSScriptKindProvider(
	provider: ScriptKindProvider,
): () => boolean {
	globalTyped._flintScriptKindProviders.add(provider);

	return () => globalTyped._flintScriptKindProviders.delete(provider);
}

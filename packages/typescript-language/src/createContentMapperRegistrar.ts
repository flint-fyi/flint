import {
	registerTypeScriptContentMapper,
	type TypeScriptContentMapperRegistration,
} from "./contentMappers.ts";

/**
 * Registers a content mapper under a default package name, returning a
 * function that re-registers it under a different one.
 *
 * Framework plugins (`@flint.fyi/svelte`) re-point their language package's
 * mapper at themselves so TypeScript execs the plugin's own mapper binary.
 */
export function createContentMapperRegistrar(
	defaults: TypeScriptContentMapperRegistration,
): (packageName: string) => void {
	let unregister = registerTypeScriptContentMapper(defaults);
	return (packageName: string) => {
		unregister();
		unregister = registerTypeScriptContentMapper({ ...defaults, packageName });
	};
}

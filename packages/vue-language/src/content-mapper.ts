/**
 * Runs Vue's content mapper by handing this process over to `vize`.
 *
 * Unlike Astro and Svelte, Flint does not implement the `.vue` transform: vize
 * does. TypeScript resolves a mapper package from the linted project, though,
 * and package managers that do not hoist transitive dependencies leave `vize`
 * unreachable from there — so this entry, which a project can resolve, runs
 * vize's own content mapper in-process.
 */
export async function runVueContentMapper(): Promise<void> {
	process.argv.push("content-mapper");
	await import(new URL("../bin/vize", import.meta.resolve("vize")).href);
}

// `@flint.fyi/vue` re-exports this module as its own exec'd entry, so only
// hand the process to vize when this module itself is the entry.
if (import.meta.main) {
	// This is the process entry point when TypeScript spawns the mapper, so
	// nothing imports it and there is nothing for the await to delay.
	// flint-disable-next-line ts/topLevelAwaits
	await runVueContentMapper();
}

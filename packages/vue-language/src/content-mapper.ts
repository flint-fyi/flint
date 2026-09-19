import path from "node:path";
import url from "node:url";

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

// Deliberately not `isModuleEntry` from `@flint.fyi/content-mapper`: importing
// that package pulls its stdio server into this process, and vize's CLI needs
// stdin untouched.
if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)
) {
	await runVueContentMapper();
}

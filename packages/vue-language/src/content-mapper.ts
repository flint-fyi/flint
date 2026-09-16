// Unlike Astro and Svelte, Flint does not implement the `.vue` transform: vize
// does. TypeScript resolves a mapper package from the linted project, though,
// and package managers that do not hoist transitive dependencies leave `vize`
// unreachable from there — so this entry, which a project can resolve, runs
// vize's own content mapper in-process.
process.argv.push("content-mapper");
await import(new URL("../bin/vize", import.meta.resolve("vize")).href);

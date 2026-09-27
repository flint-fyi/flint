<h1 align="center"><code>@flint.fyi/performance-testing</code></h1>

<p align="center">
	Runs performance measurements for Flint and other linters.
	❤️‍🔥
</p>

> Requires [hyperfine](https://github.com/sharkdp/hyperfine#installation) to be installed globally.

## Running Performance Testing

From the repository root, create Flint's publishable artifacts with:

```shell
pnpm build
pnpm --filter-prod flint... --filter-prod @flint.fyi/astro... --filter-prod @flint.fyi/svelte... --filter-prod @flint.fyi/vue... pack
```

Generate the fixtures and run every comparison and native scenario from the repository root with:

```shell
pnpm --filter=performance-testing generate
pnpm --filter=performance-testing measure
```

`generate` replaces `packages/performance-testing/cases`, installs the packed artifacts there, and creates identical fixtures for each measurement.

`measure` first runs the existing Flint and ESLint size-and-rule comparisons.
It then reports Flint timings for cold project startup, a warm unchanged lint, one changed file after a cached lint, type-aware rules, Astro, Svelte, and Vue.
The warm and changed-file preparations run before every Hyperfine sample so samples do not share cache state.

The output reports whole-command timings because Flint does not currently expose native phase timings for project creation, AST transfer, checker queries, mapper transformation, or rule execution.

<h1 align="center"><code>@flint.fyi/performance-testing</code></h1>

<p align="center">
	Runs performance measurements for Flint and other linters.
	❤️‍🔥
</p>

```shell
pnpm generate
DEBUG=*runInHyperfine pnpm measure
```

## Comparability

`pnpm generate` writes one test case directory per (files, rules) pair, each containing an `eslint.config.js` and a `flint.config.ts` meant to ask for the same work:

- **Same files.** Both configs lint `src/**/*.ts` and ignore `node_modules` and `*.config.*`, so neither linter is charged for the other's config file.
- **Same rules.** Every enabled rule comes from a `@flint.fyi/rule-data` entry that maps a Flint rule to an ESLint rule, so the counts match exactly.
Flint rules that map to several overlapping ESLint rules — typically a core rule and its typescript-eslint extension — are paired with just one of them, preferring the typescript-eslint rule, then the core rule, then the plugin rule that sorts first.
- **Same type information.** Both run type-aware: ESLint through `projectService`, Flint through the case's `tsconfig.json`.
- **Same cold start.** Flint runs with `--cache-ignore` so Hyperfine's repeated runs re-lint from scratch, matching ESLint's lack of a cache.
Flint also runs with `--skip-formatting` and `--skip-language-reports`, which have no ESLint equivalent.

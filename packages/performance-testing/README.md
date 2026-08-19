<h1 align="center"><code>@flint.fyi/performance-testing</code></h1>

<p align="center">
	Runs performance measurements for Flint and other linters.
	❤️‍🔥
</p>

```shell
pnpm generate
DEBUG=*runInHyperfine pnpm measure
```

## Results

Measured with Hyperfine 1.20.0 on an Apple Silicon Mac running Node 24.13.1, against ESLint 10.8.0 and typescript-eslint 8.66.0:

```text
┌───────────────────────┬───────┬───────────────────────┬───────┐
│ eslint                │ files │ flint                 │ rules │
├───────────────────────┼───────┼───────────────────────┼───────┤
│ '543.0 ms ±  24.1 ms' │ 2     │ '791.5 ms ±  23.3 ms' │ 1     │
│ '781.0 ms ±  29.1 ms' │ 2     │ '844.7 ms ±  46.8 ms' │ 119   │
│ '854.7 ms ±  56.7 ms' │ 2     │ '827.4 ms ±  38.6 ms' │ 272   │
│ '966.5 ms ±  22.7 ms' │ 256   │ '1.060 s ±  0.054 s'  │ 1     │
│ '1.301 s ±  0.037 s'  │ 256   │ '1.234 s ±  0.043 s'  │ 119   │
│ '1.458 s ±  0.049 s'  │ 256   │ '1.322 s ±  0.032 s'  │ 272   │
└───────────────────────┴───────┴───────────────────────┴───────┘
```

Numbers from any one machine are only meaningful next to the other linter measured on that same machine, so treat the columns as a comparison rather than as absolute costs.

## Comparability

`pnpm generate` writes one test case directory per (files, rules) pair, each containing an `eslint.config.js` and a `flint.config.ts` meant to ask for the same work:

- **Same files.** Both configs lint `src/**/*.ts` and ignore `node_modules` and `*.config.*`, so neither linter is charged for the other's config file.
- **Same rules.** Every enabled rule comes from a `@flint.fyi/rule-data` entry that maps a Flint rule to an ESLint rule, so the counts match exactly.
Flint rules that map to several overlapping ESLint rules — typically a core rule and its typescript-eslint extension — are paired with just one of them, preferring the typescript-eslint rule, then the core rule, then the plugin rule that sorts first.
- **Same type information.** Both run type-aware: ESLint through `projectService`, Flint through the case's `tsconfig.json`.
- **Same cold start.** Flint runs with `--cache-ignore` so Hyperfine's repeated runs re-lint from scratch, matching ESLint's lack of a cache.
Flint also runs with `--skip-formatting` and `--skip-language-reports`, which have no ESLint equivalent.

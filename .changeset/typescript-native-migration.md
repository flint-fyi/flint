---
"@flint.fyi/astro": minor
"@flint.fyi/astro-language": minor
"@flint.fyi/browser": minor
"@flint.fyi/jsx": minor
"@flint.fyi/node": minor
"@flint.fyi/performance": minor
"@flint.fyi/plugin-flint": minor
"@flint.fyi/react": patch
"@flint.fyi/rule-tester": minor
"@flint.fyi/solid": patch
"@flint.fyi/spelling": patch
"@flint.fyi/svelte": minor
"@flint.fyi/svelte-language": minor
"@flint.fyi/ts": minor
"@flint.fyi/typescript-language": minor
"@flint.fyi/vitest": minor
"@flint.fyi/vue": minor
"@flint.fyi/vue-language": minor
"@flint.fyi/yaml": patch
---

Migrated type-aware linting from the TypeScript 6 compiler API to TypeScript 7.1's native synchronous API, installed as the `typescript-native` alias of `typescript@7.1.0-dev.20260830.1`.
Rules receive native `Program`, `Checker`, and AST objects, and `@flint.fyi/typescript-language` exports generated discriminated `AST` union types in place of TypeScript 6's `ts.Node` interfaces.
Astro, Svelte, and Vue files are type-checked through TypeScript content mappers spawned from each language package's new `./content-mapper` entry, so `@flint.fyi/volar-language` and `@flint.fyi/ts-patch` are no longer published.
`RuleTester` now requires an `afterAll` hook, from its options or the calling scope, to dispose native TypeScript sessions.

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

Migrated type-aware linting from the TypeScript 6 compiler API to TypeScript 7.1's native synchronous API, installed as the `typescript-native` alias of `typescript@7.1.0-beta`.
Rules receive native `Program`, `Checker`, and AST objects, and `@flint.fyi/typescript-language` exports generated discriminated `AST` union types in place of TypeScript 6's `ts.Node` interfaces.
The native API's own exports, such as `SyntaxKind` and `TypeFlags`, are re-exported from `@flint.fyi/typescript-language/native/ast` and `@flint.fyi/typescript-language/native/sync`, so plugins do not need to install TypeScript's native package themselves.
In JavaScript files, rules do not visit the nodes TypeScript creates from JSDoc type annotations.
Astro, Svelte, and Vue files are type-checked through TypeScript content mappers spawned from each language package's new `./content-mapper` entry, so `@flint.fyi/volar-language` and `@flint.fyi/ts-patch` are no longer published.
TypeScript only runs content mappers, including ones a `tsconfig.json` names, once a Flint plugin has registered one.
`RuleTester` now requires an `afterAll` hook, from its options or the calling scope, to dispose native TypeScript sessions.

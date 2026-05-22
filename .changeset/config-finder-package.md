---
"@flint.fyi/core": minor
"@flint.fyi/cli": patch
---

Extract `findConfigFileName` and `configFileNameCandidates` from `@flint.fyi/cli` into `@flint.fyi/core` so the CLI, the upcoming LSP server, and other consumers can share a single implementation.

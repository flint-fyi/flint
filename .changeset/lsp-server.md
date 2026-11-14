---
"@flint.fyi/lsp": minor
---

Add an experimental `@flint.fyi/lsp` package that implements a Language Server Protocol server backed by `LintSession`.
It publishes diagnostics for open documents on edit and re-lints transitive dependents of changed files.
The package ships a `flint-lsp` bin so editors can spawn it directly without going through `flint`.

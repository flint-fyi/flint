---
"@flint.fyi/ts": patch
---

`asyncFunctionAwaits` no longer incorrectly flags arrow functions with expression bodies; e.g. `async () => await loadData()` is now correctly recognized as containing an `await`.

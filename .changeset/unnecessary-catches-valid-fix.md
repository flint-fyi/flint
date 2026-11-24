---
"@flint.fyi/ts": patch
---

Make the `unnecessaryCatches` fix unwrap a `try` block that has no `finally` instead of leaving an invalid `try` without `catch` or `finally`.

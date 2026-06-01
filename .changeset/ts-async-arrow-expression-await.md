---
"@flint.fyi/ts": patch
---

Fix a false positive in `asyncFunctionAwaits` for async arrow functions with expression bodies.
`async () => await loadData()` is now correctly recognized as containing an `await`, since the body expression itself is checked rather than only its children.

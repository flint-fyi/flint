---
"@flint.fyi/ts": patch
---

Sped up `deprecated` by skipping the names of `export * as` declarations, which can never be deprecated references.

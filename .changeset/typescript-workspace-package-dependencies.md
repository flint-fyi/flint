---
"@flint.fyi/typescript-language": patch
---

Count imports of workspace packages linked through node_modules as file dependencies, so changes to them invalidate cached results.

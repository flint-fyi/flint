---
"@flint.fyi/core": patch
"@flint.fyi/typescript-language": patch
---

Preserve global cache invalidation across cache-hit runs so changing a global declaration re-lints unrelated files.
Rename the language cache-impact flag from `invalidatesCache` to `isGlobalDependency`.

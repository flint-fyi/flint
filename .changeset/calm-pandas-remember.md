---
"@flint.fyi/core": patch
---

Preserve global cache invalidation across cache-hit runs so changing a global declaration re-lints unrelated files.
Existing cache files will be rebuilt using the updated format.

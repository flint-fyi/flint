---
"@flint.fyi/core": patch
"@flint.fyi/ts": patch
"@flint.fyi/typescript-language": patch
---

Reduced the number of requests Flint makes to the native TypeScript process per linted file, which made large projects with many rules lint slower than under TypeScript 6.

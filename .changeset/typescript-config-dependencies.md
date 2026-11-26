---
"@flint.fyi/cli": patch
"@flint.fyi/typescript-language": patch
---

The TypeScript dependency tracker now includes each file's tsconfig, the configs it extends, and its package.json, so watch mode no longer restarts when one of them changes.

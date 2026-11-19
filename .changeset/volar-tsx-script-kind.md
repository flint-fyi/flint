---
"@flint.fyi/ts-patch": patch
"@flint.fyi/volar-language": patch
---

Reports each Volar.js-based file to TypeScript with its generated code's script kind, such as TSX for `.astro` and `.svelte` files, so rebuilding a program after one of their imports changes no longer fails with `Script kind should match provided ScriptKind`.

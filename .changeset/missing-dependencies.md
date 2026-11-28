---
"@flint.fyi/cli": patch
"@flint.fyi/core": patch
---

Languages can report `missingDependencies`, paths that don't exist yet, and creating one re-lints the files that reported it.
Watch mode also re-lints dependents when a reported dependency outside the watched directory changes, such as a shared tsconfig.

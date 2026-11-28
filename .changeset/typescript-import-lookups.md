---
"@flint.fyi/ts-patch": patch
"@flint.fyi/typescript-language": patch
---

Re-lint TypeScript files when a module an import could resolve to is created, such as a relative import, a `rootDirs` or `paths` target, a `moduleSuffixes` variant, a file with an extra supported extension such as `.vue`, or an installed package, and when an imported package's package.json changes.

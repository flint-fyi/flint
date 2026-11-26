---
"@flint.fyi/typescript-language": patch
---

Re-lint TypeScript files when a closer tsconfig, jsconfig, or package.json is created, when a file that a tsconfig's `files` or `include` names is generated, when a config that a tsconfig `extends` or a package that its `types` lists is created, when a declaration file in a custom `typeRoots` directory is created, and when a global declaration outside the linted files changes, such as an installed `@types` package.

---
"@flint.fyi/core": patch
---

The lint cache records each file's missing dependencies and re-lints the file once one of them exists.
The cache no longer treats the root package.json as a dependency of every file; languages report the package.json files each file depends on.

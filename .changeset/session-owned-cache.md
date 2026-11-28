---
"@flint.fyi/cli": patch
"@flint.fyi/core": minor
---

Breaking: removed `runConfig`, `runConfigFixing`, and `lintSessionWithCache` from `@flint.fyi/core`.
`LintSession` owns the cache instead: pass `{ cacheLocation, ignoreCache }` to `LintSession.create`, call `session.lint()` to restore the cache checkpoint and lint changed files, `session.fixFiles()` to apply fixes, and `session.writeCache()` to write a checkpoint.
`restoreCachedResults` is no longer public.

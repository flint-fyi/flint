---
"@flint.fyi/core": minor
---

Added an `onResults` option to `LintSession.lintChangedFiles` that reports each lint pass, and made global dependency changes re-lint only files the session has results for.
Files that a failed lint pass left without fresh results are re-linted on the next `lintChangedFiles` call.

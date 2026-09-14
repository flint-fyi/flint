---
"@flint.fyi/cli": patch
"@flint.fyi/core": minor
---

Adds a new `LintSession` class to track the relevant files after each change and only lint the ones that have updated inputs.
Uses the session in `--watch` mode and rebuilds it when config or fileset changes require a fresh project view.

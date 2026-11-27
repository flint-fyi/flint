---
"@flint.fyi/core": patch
---

Makes the disk-backed host's file and directory watchers keep the process running, matching TypeScript's own watchers, so `flint --watch` without `--interactive` keeps re-linting changed files until it is stopped.

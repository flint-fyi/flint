---
"@flint.fyi/cli": patch
"flint": patch
---

Defer linting dependencies until needed so `--help` and `--version` avoid loading the lint engine and TypeScript.
Load the TypeScript patch immediately before user configs, and load watch mode, interactive rendering, and formatting only when selected.

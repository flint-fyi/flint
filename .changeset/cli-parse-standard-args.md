---
"@flint.fyi/cli": patch
---

Parse CLI options with `parse-standard-args`, so invalid flags and `--presenter` values print a friendly error and exit with code 2 instead of throwing.
Add `-h` and `-v` aliases for `--help` and `--version`, and `--no-<flag>` negations for boolean flags.

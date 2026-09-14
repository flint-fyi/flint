---
"@flint.fyi/core": patch
---

Ignore empty fix arrays, including fixes entirely filtered out by source mapping, so they do not write unchanged source files, count files as changed, or trigger repeated fixing rounds.

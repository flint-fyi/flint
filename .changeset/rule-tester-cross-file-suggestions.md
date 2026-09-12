---
"@flint.fyi/rule-tester": minor
---

Reject incomplete or mismatched cross-file suggestion expectations that were previously accepted.
Each expected suggestion must match the corresponding reported suggestion in flattened report order, including its own-file or cross-file variant and exact target-path set.
Update tests to list every reported target path, remove paths that the corresponding suggestion does not target, and keep each suggestion's expectations separate.
Mixed own-file and cross-file suggestions are now supported in the same test case.

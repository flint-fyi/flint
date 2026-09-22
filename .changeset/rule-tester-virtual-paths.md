---
"@flint.fyi/rule-tester": minor
"@flint.fyi/spelling": patch
---

Resolve expected cross-file suggestion paths against the test host's current directory, so fixtures can use relative path literals.
Rules must report absolute target paths; relative reported targets are no longer accepted.
Add `virtualFSRoot` to set the working directory for in-memory tests independently of the process cwd.
Target CSpell dictionary suggestions at the absolute configuration path used to read the dictionary.

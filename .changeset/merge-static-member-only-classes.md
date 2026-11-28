---
"@flint.fyi/rule-data": patch
"@flint.fyi/ts": minor
---

Removed `ts/staticMemberOnlyClasses` because `ts/extraneousClasses` already reports classes that only contain static members.
Replace references to `staticMemberOnlyClasses` in your configuration with `extraneousClasses`, using its `allowStaticOnly` option to allow static-only classes.

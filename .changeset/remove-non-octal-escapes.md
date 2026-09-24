---
"@flint.fyi/rule-data": patch
"@flint.fyi/ts": minor
---

Removed `ts/nonOctalDecimalEscapes` because TypeScript already rejects non-octal decimal escapes in ordinary strings and untagged templates.
Tagged templates permit these sequences and should not be reported.
Remove explicit references to this rule from your configuration.

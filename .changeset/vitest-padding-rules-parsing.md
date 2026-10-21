---
"@flint.fyi/vitest": patch
---

Recognize Vitest functions in padding rules with the same parsing as other Vitest rules, so `suite`, `aroundAll`, `aroundEach`, and tagged-template tables such as ``test.each`...` `` are now padded.
Apply `describePaddingLines` to `suite` as well as `describe`.

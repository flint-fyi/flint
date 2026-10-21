---
"@flint.fyi/vitest": patch
---

Report `expect.soft()`, `expect.poll()`, `expect.element()`, and `expect` utility calls such as `expect.hasAssertions()` inside conditionals in `conditionalExpects`, and report the full assertion chain instead of only the `expect(...)` call.

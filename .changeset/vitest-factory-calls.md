---
"@flint.fyi/vitest": patch
---

Stop recognizing uninvoked Vitest factories, such as `test.runIf(true)`, and unknown invoked members, such as `test.nonsense([1])()`, as Vitest functions in Vitest rules.
Only recognize members that exist on each kind of Vitest function, so calls such as `test.shuffle()`, `describe.fails()`, and `beforeEach.skip()` are no longer treated as Vitest functions.
Count test cases created through `test.extend()` and `test.scoped()`, such as `test.extend({})("name", () => {})`, as test cases in `hooksBeforeTestCases`.

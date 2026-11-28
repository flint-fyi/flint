---
"@flint.fyi/rule-data": minor
---

Replace `getRuleForPlugin` and `getRuleForPluginSafe` with `getRuleAbout` and `getRuleAboutSafe`, which return each rule's `about` data inlined at build time, so the package no longer depends on Flint plugins at runtime.

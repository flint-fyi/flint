---
"@flint.fyi/core": patch
---

Reject `pluginId` in the `about` passed to `RuleCreator.createRule`, since the creator already sets it.
Moves `pluginId` from `RuleAbout` to the new `PluginRuleAbout`.

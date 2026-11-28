---
"@flint.fyi/core": minor
"@flint.fyi/rule-tester": patch
---

Moves `runFileVisitors`, `getFileCacheImpacts`, and `getLanguageReports` from `Language` onto each `LanguageFile` its language creates, so a language's members only ever receive files it created.
`RuleCreator.createRule` infers its node and service types from the language, replacing the removed `GetLanguageAstNodesByName` and `GetLanguageFileServices` types.

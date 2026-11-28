---
"@flint.fyi/core": minor
"@flint.fyi/css-language": patch
"@flint.fyi/json-language": patch
"@flint.fyi/markdown-language": patch
"@flint.fyi/typescript-language": minor
"@flint.fyi/volar-language": patch
"@flint.fyi/yaml-language": patch
---

Types visitor dispatch by each language's node map, so `runFileVisitorSubscriptions` only runs subscriptions on the node whose `type` matches their key.

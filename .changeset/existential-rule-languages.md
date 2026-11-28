---
"@flint.fyi/core": minor
"@flint.fyi/rule-tester": patch
"@flint.fyi/text-language": patch
"@flint.fyi/typescript-language": patch
"@flint.fyi/volar-language": patch
---

Removes `AnyLanguage`, `AnyLanguageFile`, and `AnyLanguageFileFactory`: each rule's `setup` returns an `addFileVisitors` bound to its language's node and service types, so the runner never handles erased types.
`LanguageFile` no longer exposes `services`, which only its language and that language's rules can read, and `Language.extendServices` creates views for rules that use services only some files provide.

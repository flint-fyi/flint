---
"@flint.fyi/core": minor
"@flint.fyi/utils": minor
---

Added lifecycle hooks languages need to hold whole-program state: `LanguageFileFactory` is now disposable and may implement `prepareFiles` to open every file before any `createFile` call, and language files may provide `adjustFixRange` separately from `adjustReportRange`.
`LinterHost` gained an optional `isDiskBacked` flag, which `createDiskBackedLinterHost` sets, so tooling can read the disk directly instead of routing every probe through the host.
`@flint.fyi/utils` exports `isUnderDirectory` and `getPathInsideDirectory`.

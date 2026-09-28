---
"@flint.fyi/cli": patch
"@flint.fyi/core": minor
"@flint.fyi/rule-tester": patch
---

Move `createDiskBackedLinterHost` and `isFileSystemCaseSensitive` to a new `@flint.fyi/core/node` entry point, so the main entry no longer imports Node.js built-ins.
Invalid-config errors no longer print a `Received:` line.

---
"@flint.fyi/cli": patch
"@flint.fyi/core": minor
---

Adds `createRelayFileSystemWatcher` and uses it in `--watch` mode so TypeScript's file watchers share Flint's one recursive watcher instead of each opening a native one.

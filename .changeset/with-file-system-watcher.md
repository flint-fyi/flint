---
"@flint.fyi/core": minor
---

Add `withFileSystemWatcher(host, watcher)`, which composes a `FileSystemWatcher` onto an existing linter host so its directory/file watching is driven by that watcher.
Editor integrations (such as a language server) use it to feed their own filesystem events into the linter instead of relying on the host's default watching.

`watchDirectorySync` callbacks may now receive an optional change event (`"created"`, `"changed"`, or `"deleted"`) alongside the path, so watchers that know what kind of change occurred can report it.

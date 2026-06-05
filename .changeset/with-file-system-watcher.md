---
"@flint.fyi/core": minor
---

Add `withFileSystemWatcher` to allow using an editor's (or other processes') built-in file-system watcher rather than direct file-polling.

`watchDirectorySync` callbacks now optionally consume the kind of change (created/edited/deleted).

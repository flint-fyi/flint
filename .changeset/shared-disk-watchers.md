---
"@flint.fyi/core": patch
---

Share one native watcher between disk host watchers of the same path, avoiding `MaxListenersExceededWarning` when many watchers target one file.

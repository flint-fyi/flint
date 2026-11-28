---
"@flint.fyi/cli": patch
"@flint.fyi/core": patch
---

Skip the watch session rebuild when the only change is a directory that holds nothing but ignored paths, such as the `node_modules` directory created by the first cache write.

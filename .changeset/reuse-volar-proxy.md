---
"@flint.fyi/volar-language": patch
---

Reuses Volar.js's proxied `createProgram` across program creations, so rebuilding a program regenerates virtual code only for the Volar.js-based files whose text changed.

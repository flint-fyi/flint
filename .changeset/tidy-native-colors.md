---
"@flint.fyi/cli": patch
---

Replace Chalk with Node.js native terminal styling.
Report colors retain their RGB values without low-color downconversion, and terminal styling now honors `NO_COLOR` and `NODE_DISABLE_COLORS`.

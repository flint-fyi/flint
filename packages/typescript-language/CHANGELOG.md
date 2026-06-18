# @flint.fyi/typescript-language

## 0.18.4

### Patch Changes

- [#2917](https://github.com/flint-fyi/flint/pull/2917) [`87e9ad4`](https://github.com/flint-fyi/flint/commit/87e9ad4da64ac3cb48296a2361a86e815b1f06f5) - Tag each `ScopeVariable` with its definition kind via `defs` (variable, parameter, catch, function, class, import).

## 0.18.3

### Patch Changes

- [#2828](https://github.com/flint-fyi/flint/pull/2828) [`ca4d017`](https://github.com/flint-fyi/flint/commit/ca4d017c5faecfe86199c2a08f26ed795f037cb7) - Add a TypeScript scope manager API for resolving declarations and references.

- [#2856](https://github.com/flint-fyi/flint/pull/2856) [`5ee9a84`](https://github.com/flint-fyi/flint/commit/5ee9a8413b7a47cad3569a7df185f6e5e198908f) - Add structured source metadata to language reports.

- [#2916](https://github.com/flint-fyi/flint/pull/2916) [`e27a8cd`](https://github.com/flint-fyi/flint/commit/e27a8cd3286587e5ed48843f808c7f39095d41dd) - Add `ScopeManager.getScope(node)` to resolve the innermost scope containing a node.

- Updated dependencies [[`5ee9a84`](https://github.com/flint-fyi/flint/commit/5ee9a8413b7a47cad3569a7df185f6e5e198908f)]:
  - @flint.fyi/core@0.23.0

## 0.18.2

### Patch Changes

- Updated dependencies [61076ad]
  - @flint.fyi/core@0.22.0

## 0.18.1

### Patch Changes

- fe112e0: Support `disable-next-line` directives targeting the next code line, skipping intervening comments.

## 0.18.0

### Minor Changes

- 57fa268: Add optional character range to language reports.
- cb7e8a8: Change "diagnostics" nomenclature to "language reports".
All external references to the term diagnostic or diagnostics are now using the term language report instead.

### Patch Changes

- 0702aa2: Introduce Volar.js meta-language.
- Updated dependencies [4fc0eef]
- Updated dependencies [57fa268]
- Updated dependencies [dde886f]
- Updated dependencies [1539f14]
- Updated dependencies [0702aa2]
- Updated dependencies [cb7e8a8]
- Updated dependencies [d3f5d17]
  - @flint.fyi/core@0.21.0

## 0.17.0

### Minor Changes

- e257ec4: Use `LinterHost` for linting.

### Patch Changes

- b3a637a: Add `:exit` listeners to JSON, Markdown, and TypeScript.
- db34436: Unify language file factory methods using `LinterHost`.
- Updated dependencies [4c99c11]
- Updated dependencies [b3a637a]
- Updated dependencies [e257ec4]
- Updated dependencies [d612d50]
- Updated dependencies [4b32a64]
- Updated dependencies [fe76156]
- Updated dependencies [db34436]
- Updated dependencies [f2f2c8b]
- Updated dependencies [442a3f4]
- Updated dependencies [5c64fbb]
- Updated dependencies [3eaea9e]
- Updated dependencies [267fe8d]
- Updated dependencies [011fbf2]
  - @flint.fyi/core@0.20.0

## 0.16.0

### Minor Changes

- 3353692: feat: split languages into dedicated packages

### Patch Changes

- Updated dependencies [6a5e553]
- Updated dependencies [2fb9715]
- Updated dependencies [3353692]
- Updated dependencies [3561386]
  - @flint.fyi/core@0.19.0

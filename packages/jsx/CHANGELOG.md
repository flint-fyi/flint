# @flint.fyi/jsx

## 0.6.2

### Patch Changes

- Updated dependencies [[`9372aeb`](https://github.com/flint-fyi/flint/commit/9372aeb77826b628a7d6d6013786bcbb85fd5a4b)]:
  - @flint.fyi/typescript-language@0.21.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`7d6522c`](https://github.com/flint-fyi/flint/commit/7d6522cf53a5c7f9cf7823cf255e1cbdfef511a3), [`5b63f69`](https://github.com/flint-fyi/flint/commit/5b63f6901ff0d6cfabe4dbf61cb3f0333dc94602)]:
  - @flint.fyi/core@0.26.0

## 0.6.0

### Minor Changes

- [#3168](https://github.com/flint-fyi/flint/pull/3168) [`5d98e15`](https://github.com/flint-fyi/flint/commit/5d98e15aa3aefbd3eaf6df6b4b9ead019a7d1c34) - Drop support for node versions <26.1.0.

### Patch Changes

- Updated dependencies [[`5d98e15`](https://github.com/flint-fyi/flint/commit/5d98e15aa3aefbd3eaf6df6b4b9ead019a7d1c34), [`3f8e15d`](https://github.com/flint-fyi/flint/commit/3f8e15d092d0177bcbf0de75718a075bf5fb4c21)]:
  - @flint.fyi/typescript-language@0.20.0
  - @flint.fyi/utils@0.16.0
  - @flint.fyi/core@0.25.0

## 0.5.0

### Minor Changes

- [#3118](https://github.com/flint-fyi/flint/pull/3118) [`c737600`](https://github.com/flint-fyi/flint/commit/c7376006022dc527a18e5ab433b81fb9687bdf20) - Begin bundling all package entry points.

### Patch Changes

- Updated dependencies [[`c737600`](https://github.com/flint-fyi/flint/commit/c7376006022dc527a18e5ab433b81fb9687bdf20)]:
  - @flint.fyi/typescript-language@0.19.0
  - @flint.fyi/utils@0.15.0
  - @flint.fyi/core@0.24.0

## 0.4.0

### Minor Changes

- [#3064](https://github.com/flint-fyi/flint/pull/3064) [`1f71b3e`](https://github.com/flint-fyi/flint/commit/1f71b3ef2d31dbe39ff8c967887801912fb28573) - Removed support for TypeScript 5.

## 0.3.3

### Patch Changes

- Updated dependencies [[`5ee9a84`](https://github.com/flint-fyi/flint/commit/5ee9a8413b7a47cad3569a7df185f6e5e198908f)]:
  - @flint.fyi/core@0.23.0

## 0.3.2

### Patch Changes

- Updated dependencies [61076ad]
  - @flint.fyi/core@0.22.0

## 0.3.1

### Patch Changes

- 97a76ab: Prevent `jsx/autoFocusProps` from double reporting ts issues.
- 1044826: `imageAltTexts` should not report on known non-string values.
- Updated dependencies [4fc0eef]
- Updated dependencies [57fa268]
- Updated dependencies [dde886f]
- Updated dependencies [1539f14]
- Updated dependencies [0702aa2]
- Updated dependencies [cb7e8a8]
- Updated dependencies [d3f5d17]
  - @flint.fyi/core@0.21.0
  - @flint.fyi/typescript-language@0.18.0

## 0.3.0

### Minor Changes

- d85f625: Add file selectors.
  The plugin now includes the following selectors:
  - `all`: `**/*.{jsx,tsx}`
  - `javascript`: `**/*.jsx`
  - `typescript`: `**/*.tsx`

### Patch Changes

- 7403874: Also validate output when testing rules.
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
  - @flint.fyi/typescript-language@0.17.0

## 0.2.0

### Minor Changes

- 3353692: feat: split languages into dedicated packages

### Patch Changes

- 6a5e553: feat(core): add RuleCreator class
- Updated dependencies [6a5e553]
- Updated dependencies [2fb9715]
- Updated dependencies [3353692]
- Updated dependencies [3561386]
  - @flint.fyi/core@0.19.0
  - @flint.fyi/typescript-language@0.16.0

## 0.1.2

### Patch Changes

- 602c75c: chore: rework packaging with tsdown
- Updated dependencies [f1a6f9e]
- Updated dependencies [ff52cb1]
- Updated dependencies [602c75c]
  - @flint.fyi/ts@0.15.1
  - @flint.fyi/core@0.18.1

## 0.1.1

### Patch Changes

- d99170f: fix: add missing ("phantom") dependencies to package.jsons
- 3617e4f: chore: pass services to rule visitors
- Updated dependencies [483ee56]
- Updated dependencies [d99170f]
- Updated dependencies [3617e4f]
- Updated dependencies [f37f0d0]
- Updated dependencies [59a78c0]
- Updated dependencies [5e23e96]
- Updated dependencies [618f259]
- Updated dependencies [52f8cc4]
- Updated dependencies [46f2d0e]
- Updated dependencies [3117eaf]
  - @flint.fyi/core@0.17.0
  - @flint.fyi/ts@0.15.0
  - @flint.fyi/rule-tester@0.15.0

## 0.1.0

### Minor Changes

- c8bad31: feat: add JSX plugin with accessKeys rule

### Patch Changes

- Updated dependencies [9b6b884]
- Updated dependencies [c8bad31]
  - @flint.fyi/ts@0.14.3

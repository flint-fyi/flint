# @flint/core

## 0.18.1

### Patch Changes

- ff52cb1: fix: filter out cached files when collecting metadata
- 602c75c: chore: rework packaging with tsdown
- Updated dependencies [9a8ecc1]
- Updated dependencies [602c75c]
  - @flint.fyi/utils@0.14.0

## 0.18.0

### Minor Changes

- 1d81a8f: fix!: move runPrettier to @flint/cli, add peer dependency on prettier to prevent skew-induced crashes

## 0.17.0

### Minor Changes

- 483ee56: feat(core): export getPositionOfColumnAndLine utility
  feat(ts): allow passing loose TS-based diagnostics to convertTypeScriptDiagnosticToLanguageFileDiagnostic
- 5e23e96: feat(core): add patching mechanism for `typescript.js` to allow creating TS program with non-TS files

### Patch Changes

- d99170f: fix: add missing ("phantom") dependencies to package.jsons
- 3617e4f: chore: pass services to rule visitors
- 3117eaf: feat: add optional async teardown() for rules
- Updated dependencies [d99170f]
  - @flint.fyi/utils@0.13.3

## 0.16.0

### Minor Changes

- 1bbae2e: feat(core): add `binarySearch` and `getLineAndColumnOfPosition` utilities

### Patch Changes

- 11abdff: fix(core): properly resolve `flint-disable-*` directives selection when comment has trailing whitespaces

## 0.15.2

### Patch Changes

- 5bca9c4: fix(core): make `Rule` type assignable to `AnyRule`

## 0.15.1

### Patch Changes

- 3d19082: fix: use 0-indexed column and line across codebase

## 0.15.0

### Minor Changes

- 7d0d873: add // flint-\* comment directives
- 79f15da: add --skip-diagnostics CLI flag

### Patch Changes

- b48f4a9: ignore empty gitignore lines

## 0.14.0

### Minor Changes

- aa0bdcb: add --cache-ignore

### Patch Changes

- 0473d6c: move omit-empty dependency from root to core

## 0.13.5

### Patch Changes

- 0b80834: allow rules to indicate dependencies
- 63b61e5: add --suggestions to CLI
- Updated dependencies [63b61e5]
  - @flint.fyi/utils@0.13.2

## 0.13.4

### Patch Changes

- a4b07b1: remove TypeScript properties from RuleContext
- 3c3bcae: combine config exclude and globs into files
- ec4a4ff: allow rules to be async

## 0.13.3

### Patch Changes

- 3ef4331: fix type errors passing rules to defineConfig

## 0.13.2

### Patch Changes

- 4904678: allow omitting globs for createPlugin

## 0.13.1

### Patch Changes

- 9909b48: add README.md
- Updated dependencies [9909b48]
  - @flint.fyi/utils@0.13.1

## 0.13.0

### Minor Changes

- 72ed00b: feat: split into a monorepo

### Patch Changes

- Updated dependencies [72ed00b]
  - @flint/utils@0.13.0

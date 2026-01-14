# @flint/ts

## 0.15.1

### Patch Changes

- f1a6f9e: fix: support dynamic and type imports in reference collection
- 602c75c: chore: rework packaging with tsdown
- Updated dependencies [ff52cb1]
- Updated dependencies [602c75c]
  - @flint.fyi/core@0.18.1

## 0.15.0

### Minor Changes

- 483ee56: feat(core): export getPositionOfColumnAndLine utility
  feat(ts): allow passing loose TS-based diagnostics to convertTypeScriptDiagnosticToLanguageFileDiagnostic
- 59a78c0: feat(ts): export reusable TS-based language preparation util
- 618f259: feat(ts): decouple parsing and extracion of `// flint-*` directives in TS files
- 52f8cc4: feat(ts): export cache impact collection and TS diangostic conversion utils
- 46f2d0e: feat(ts): \[withStatements\] add rule

### Patch Changes

- d99170f: fix: add missing ("phantom") dependencies to package.jsons
- 3617e4f: chore: pass services to rule visitors
- 3117eaf: feat: add optional async teardown() for rules
- Updated dependencies [483ee56]
- Updated dependencies [d99170f]
- Updated dependencies [3617e4f]
- Updated dependencies [f37f0d0]
- Updated dependencies [5e23e96]
- Updated dependencies [3117eaf]
  - @flint.fyi/core@0.17.0
  - @flint.fyi/rule-tester@0.15.0

## 0.14.6

### Patch Changes

- b789918: fix(ts): [forDirections] allow multi-part conditions
- Updated dependencies [1bbae2e]
- Updated dependencies [11abdff]
  - @flint.fyi/core@0.16.0

## 0.14.5

### Patch Changes

- 7e21021: fix(ts): [chainedAssignments] allow non-assignment right-side operators

## 0.14.4

### Patch Changes

- 158b542: expose \`program\` in TS rules context
- Updated dependencies [3d19082]
- Updated dependencies [a3f9043]
  - @flint.fyi/core@0.15.1
  - @flint.fyi/rule-tester@0.14.2

## 0.14.3

### Patch Changes

- 9b6b884: added browser plugin with alerts rule
- c8bad31: feat: add JSX plugin with accessKeys rule

## 0.14.2

### Patch Changes

- 6415134: feat: implement debuggerStatements rule for TypeScript plugin
- Updated dependencies [b58d145]
  - @flint.fyi/rule-tester@0.14.1

## 0.14.1

### Patch Changes

- 27280d3: use first names for ts.SyntaxKind visitors, not aliases

## 0.14.0

### Minor Changes

- 7d0d873: add // flint-\* comment directives

### Patch Changes

- Updated dependencies [b48f4a9]
- Updated dependencies [7d0d873]
- Updated dependencies [79f15da]
  - @flint.fyi/core@0.15.0
  - @flint.fyi/rule-tester@0.14.0

## 0.13.2

### Patch Changes

- 0b80834: allow rules to indicate dependencies
- Updated dependencies [0b80834]
- Updated dependencies [63b61e5]
  - @flint.fyi/core@0.13.5

## 0.13.1

### Patch Changes

- 9909b48: add README.md
- Updated dependencies [9909b48]
  - @flint.fyi/core@0.13.1
  - @flint.fyi/rule-tester@0.13.1

## 0.13.0

### Minor Changes

- 72ed00b: feat: split into a monorepo

### Patch Changes

- Updated dependencies [72ed00b]
  - @flint/rule-tester@0.13.0
  - @flint/core@0.13.0

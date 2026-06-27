# @flint.fyi/comparisons

## 0.3.6

### Patch Changes

- [#2816](https://github.com/flint-fyi/flint/pull/2816) [`08323ad`](https://github.com/flint-fyi/flint/commit/08323add35de3d836496be1d0ca2e702f58de0ca) - Added Biome rules.

- [#2970](https://github.com/flint-fyi/flint/pull/2970) [`dcd90d6`](https://github.com/flint-fyi/flint/commit/dcd90d66839a48170d7587fcfe68f75d6957da4a) - Added Oxlint rule coverage to comparison data and tests.

## 0.3.5

### Patch Changes

- [#2822](https://github.com/flint-fyi/flint/pull/2822) [`dad421e`](https://github.com/flint-fyi/flint/commit/dad421eae979c6d49cccc5bf40aca59791c98773) - Add CSS rule comparisons.

- [#2858](https://github.com/flint-fyi/flint/pull/2858) [`48fab32`](https://github.com/flint-fyi/flint/commit/48fab322ffd18e722f9c4a5c58d93f756c3f6b8e) - Add @eslint-react rules to comparison data.

- Updated dependencies [[`c953313`](https://github.com/flint-fyi/flint/commit/c9533135a4bcf39f9a2fed7a9f70c8a4ac13cf58), [`25712ea`](https://github.com/flint-fyi/flint/commit/25712ea8931cfaf9354a94cb3c0bdb6143c46962), [`6004702`](https://github.com/flint-fyi/flint/commit/6004702ed261879a894e6295a9ac5965198cc68a), [`5ee9a84`](https://github.com/flint-fyi/flint/commit/5ee9a8413b7a47cad3569a7df185f6e5e198908f), [`5c848a9`](https://github.com/flint-fyi/flint/commit/5c848a9a72ab2128bccfde8054b7d08bdc5cce95)]:
  - @flint.fyi/ts@0.20.0
  - @flint.fyi/core@0.23.0
  - @flint.fyi/css@0.0.2

## 0.3.4

### Patch Changes

- b007575: Add CSS language and plugin.
- c65a939: Fix mismatched implementation statuses.
- d4b17c7: Update data for the vitest plugin.
- ed1b0fc: Add missing `package-json` data and update eslint urls.
- 06f86d3: Add `peerDependenciesMetaRelationship` rule.
- Updated dependencies [b007575]
  - @flint.fyi/css@0.0.1

## 0.3.3

### Patch Changes

- 432d186: Add the `package-json/dependencyUniqueness` rule.
- c23b6a6: Added missing package-json rule entries.
- 320a8ee: Add the `publishConfigRedundancy` rule.

## 0.3.2

### Patch Changes

- 111f8ee: Added package-json/repositoryShorthand rule.
- c35722a: Ban duplicate Flint rules in comparisons data.
- 36d8bb1: Added package-json-validator@1.5.0 validity rules.
- 6f2a1b2: Added testCasesWithinDescribes rule.
- 8eed0f6: Added remaining \*Padding\* rules.
- 3eee30e: Added `afterAllPaddingLines` rule.

## 0.3.1

### Patch Changes

- 9cdc819: Added initial Vitest plugin with `nodeTestImports` rule.

## 0.3.0

### Minor Changes

- 07e1011: Remove the Sorting plugin and move the underlying rules to their corresponding language plugins.

### Patch Changes

- 6d013fe: Added direct validity rules.
- 94403c7: Added direct presence rules.
- fb59513: Update eslint-plugin-package-json owner to michaelfaith.
- 6d013fe: Add in missing already-present validator rules.

## 0.2.1

### Patch Changes

- a22b5b2: Mark three superseded rules as such.
- bc632d1: Remove `regexNamedCaptureGroups` and `regexUnicodeEscapes` from presets.
- bb3e1b2: Add `testCaseNameDuplicates` rule.
- 506602f: Change `untyped` preset name to `javascript`.
- bc65fe7: Remove `yamlKeys` from the Sorting plugin presets.
- 1915940: update package-json comparison data

## 0.2.0

### Minor Changes

- 3353692: feat: split languages into dedicated packages

### Patch Changes

- 56463f0: fix(comparisons): mark import/no-extraneous-dependencies as superseded by Knip

## 0.1.4

### Patch Changes

- 602c75c: chore: rework packaging with tsdown

## 0.1.3

### Patch Changes

- 0221e1e: fix(comparisons): mention missing non-deprecated builtin rules of ESLint

## 0.1.2

### Patch Changes

- d99170f: fix: add missing ("phantom") dependencies to package.jsons

## 0.1.1

### Patch Changes

- f251e68: fix(comparisons): mark imageAltRedundancy as not implementing

## 0.1.0

### Minor Changes

- d89c480: feat(comparisons): add eslint-plugin-eslint-plugin comparisons
- 479574c: feat(comparisons): add Markdownlint rules

## 0.0.3

### Patch Changes

- c421ea3: correct constructorReturns to be untyped preset
- c8bad31: feat: add JSX plugin with accessKeys rule

## 0.0.2

### Patch Changes

- 1397420: removed private: true from package.json

## 0.0.1

### Patch Changes

- 6415134: feat: implement debuggerStatements rule for TypeScript plugin

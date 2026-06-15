# @flint.fyi/json-language

## 0.17.0

### Minor Changes

- [#2867](https://github.com/flint-fyi/flint/pull/2867) [`9386e9a`](https://github.com/flint-fyi/flint/commit/9386e9ae62269aaf659aad31ee459f6ecf45ca72) - Reduce public API to specific named exports.

### Patch Changes

- [#2851](https://github.com/flint-fyi/flint/pull/2851) [`2ffc7eb`](https://github.com/flint-fyi/flint/commit/2ffc7eb1d0d885fe9b9e758d8bff649a97553380) - Add `JsonExpression` and `PropertyAssignment` to the `JsonNode` union.

- [#2901](https://github.com/flint-fyi/flint/pull/2901) [`91f1cc2`](https://github.com/flint-fyi/flint/commit/91f1cc2d211f49f2cde6349cbab28548484b42d8) - Deprecate the legacy TS-based `jsonLanguage`.
Use the language exported from `./new` instead.

- [#2871](https://github.com/flint-fyi/flint/pull/2871) [`0e8c8ab`](https://github.com/flint-fyi/flint/commit/0e8c8ab4926792ebe7b5b881e78e2b6e8ae4cd96) - Add `./new` entry point with new version of the language based on the AST provided by `momoa`.
This will utlimately replace the current TS-based implementation.
- Updated dependencies [[`5ee9a84`](https://github.com/flint-fyi/flint/commit/5ee9a8413b7a47cad3569a7df185f6e5e198908f)]:
  - @flint.fyi/core@0.23.0

## 0.16.3

### Patch Changes

- Updated dependencies [61076ad]
  - @flint.fyi/core@0.22.0

## 0.16.2

### Patch Changes

- Updated dependencies [4fc0eef]
- Updated dependencies [57fa268]
- Updated dependencies [dde886f]
- Updated dependencies [1539f14]
- Updated dependencies [0702aa2]
- Updated dependencies [cb7e8a8]
- Updated dependencies [d3f5d17]
  - @flint.fyi/core@0.21.0
  - @flint.fyi/typescript-language@0.18.0

## 0.16.1

### Patch Changes

- b3a637a: Add `:exit` listeners to JSON, Markdown, and TypeScript.
- db34436: Unify language file factory methods using `LinterHost`.
- 9697278: Implement correct post-order :exit visitor semantics.
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

# flint

## 0.16.0

### Minor Changes

- 0177958: Retry publishing failures.

### Patch Changes

- Updated dependencies [6d013fe]
- Updated dependencies [4fc0eef]
- Updated dependencies [61d1fdf]
- Updated dependencies [ea6be9e]
- Updated dependencies [ced10a1]
- Updated dependencies [94403c7]
- Updated dependencies [57fa268]
- Updated dependencies [dce37c5]
- Updated dependencies [e2c96c6]
- Updated dependencies [dde886f]
- Updated dependencies [1539f14]
- Updated dependencies [0702aa2]
- Updated dependencies [cb7e8a8]
- Updated dependencies [6d013fe]
- Updated dependencies [d3f5d17]
- Updated dependencies [8ae55cf]
  - @flint.fyi/package-json@0.17.0
  - @flint.fyi/core@0.21.0
  - @flint.fyi/ts@0.18.0
  - @flint.fyi/cli@0.19.0

## 0.16.0

### Minor Changes

- 3353692: feat: split languages into dedicated packages

### Patch Changes

- Updated dependencies [6a5e553]
- Updated dependencies [5d45d64]
- Updated dependencies [2fb9715]
- Updated dependencies [de2ff83]
- Updated dependencies [3353692]
- Updated dependencies [eb87fbe]
- Updated dependencies [2e393a1]
- Updated dependencies [3561386]
- Updated dependencies [f8bf886]
- Updated dependencies [017f3e3]
  - @flint.fyi/core@0.19.0
  - @flint.fyi/json@0.16.0
  - @flint.fyi/yaml@0.15.0
  - @flint.fyi/md@0.15.0
  - @flint.fyi/ts@0.16.0
  - @flint.fyi/cli@0.17.0
  - @flint.fyi/package-json@0.16.0
  - @flint.fyi/ts-patch@0.13.5

## 0.15.1

### Patch Changes

- 602c75c: chore: rework packaging with tsdown
- Updated dependencies [f1a6f9e]
- Updated dependencies [ff52cb1]
- Updated dependencies [602c75c]
  - @flint.fyi/ts@0.15.1
  - @flint.fyi/core@0.18.1
  - @flint.fyi/ts-patch@0.13.4
  - @flint.fyi/json@0.15.2
  - @flint.fyi/yaml@0.14.3
  - @flint.fyi/cli@0.16.1
  - @flint.fyi/md@0.14.3

## 0.15.0

### Minor Changes

- 1d81a8f: fix!: move runPrettier to @flint/cli, add peer dependency on prettier to prevent skew-induced crashes

### Patch Changes

- Updated dependencies [98de4a9]
- Updated dependencies [e5a1471]
- Updated dependencies [6541550]
- Updated dependencies [edf1e47]
- Updated dependencies [1d81a8f]
  - @flint.fyi/cli@0.16.0
  - @flint.fyi/ts-patch@0.13.3
  - @flint.fyi/core@0.18.0

## 0.14.1

### Patch Changes

- d99170f: fix: add missing ("phantom") dependencies to package.jsons
- 5e23e96: feat(core): add patching mechanism for `typescript.js` to allow creating TS program with non-TS files
- edca373: fix(cli): make `runCli` respect passed args
- Updated dependencies [483ee56]
- Updated dependencies [d99170f]
- Updated dependencies [3617e4f]
- Updated dependencies [59a78c0]
- Updated dependencies [5e23e96]
- Updated dependencies [618f259]
- Updated dependencies [edca373]
- Updated dependencies [52f8cc4]
- Updated dependencies [46f2d0e]
- Updated dependencies [3117eaf]
  - @flint.fyi/core@0.17.0
  - @flint.fyi/ts@0.15.0
  - @flint.fyi/json@0.15.1
  - @flint.fyi/yaml@0.14.2
  - @flint.fyi/cli@0.15.4
  - @flint.fyi/md@0.14.2

## 0.14.0

### Minor Changes

- c7280e9: use Node's enableCompileCache

### Patch Changes

- Updated dependencies [b48f4a9]
- Updated dependencies [7d0d873]
- Updated dependencies [79f15da]
  - @flint.fyi/core@0.15.0
  - @flint.fyi/json@0.14.0
  - @flint.fyi/cli@0.15.0
  - @flint.fyi/yml@0.14.0
  - @flint.fyi/md@0.14.0
  - @flint.fyi/ts@0.14.0

## 0.13.1

### Patch Changes

- 9909b48: add README.md
- Updated dependencies [9909b48]
  - @flint.fyi/cli@0.13.1
  - @flint.fyi/core@0.13.1
  - @flint.fyi/json@0.13.1
  - @flint.fyi/md@0.13.1
  - @flint.fyi/ts@0.13.1
  - @flint.fyi/yml@0.13.1

## 0.13.0

### Minor Changes

- 72ed00b: feat: split into a monorepo

### Patch Changes

- Updated dependencies [72ed00b]
  - @flint/core@0.13.0
  - @flint/json@0.13.0
  - @flint/cli@0.13.0
  - @flint/yml@0.13.0
  - @flint/md@0.13.0
  - @flint/ts@0.13.0

## [0.11.0](https://github.com/flint-fyi/flint/compare/0.10.3...0.11.0) (2025-06-17)

### Features

- created initial core JSON language plugin ([#91](https://github.com/flint-fyi/flint/issues/91)) ([fea720c](https://github.com/flint-fyi/flint/commit/fea720c369f55c14678752aee9b8dd0b5436adde)), closes [#46](https://github.com/flint-fyi/flint/issues/46)

## [0.10.3](https://github.com/flint-fyi/flint/compare/0.10.2...0.10.3) (2025-06-17)

### Bug Fixes

- stop hardcoding 'typescript' parser ([#90](https://github.com/flint-fyi/flint/issues/90)) ([fa7c862](https://github.com/flint-fyi/flint/commit/fa7c86229755d712a1c8409da58e7493e6cdcf6c)), closes [#84](https://github.com/flint-fyi/flint/issues/84)

## [0.10.2](https://github.com/flint-fyi/flint/compare/0.10.1...0.10.2) (2025-06-17)

### Bug Fixes

- always log formatting result in plain reporter ([#88](https://github.com/flint-fyi/flint/issues/88)) ([a20f10f](https://github.com/flint-fyi/flint/commit/a20f10f3b696bf97100e7ddcc087e94fc1dda86e)), closes [#85](https://github.com/flint-fyi/flint/issues/85)

## [0.10.1](https://github.com/flint-fyi/flint/compare/0.10.0...0.10.1) (2025-06-17)

### Bug Fixes

- allow config 'use' objects without 'rules' ([#87](https://github.com/flint-fyi/flint/issues/87)) ([df6beee](https://github.com/flint-fyi/flint/commit/df6beee3d24012b820fb2452ca5f3fd735ad9385)), closes [#86](https://github.com/flint-fyi/flint/issues/86)

## [0.10.0](https://github.com/flint-fyi/flint/compare/0.9.0...0.10.0) (2025-06-17)

### Features

- also fix formatting with --fix ([#82](https://github.com/flint-fyi/flint/issues/82)) ([82d2ff3](https://github.com/flint-fyi/flint/commit/82d2ff3176142179ffd745338cf4a472e0bd7ed3)), closes [#81](https://github.com/flint-fyi/flint/issues/81)

## [0.9.0](https://github.com/flint-fyi/flint/compare/0.8.0...0.9.0) (2025-06-16)

### Features

- format files with Prettier after linting ([#75](https://github.com/flint-fyi/flint/issues/75)) ([aecb650](https://github.com/flint-fyi/flint/commit/aecb650ca5c02d75b3c47fe6268eca1afc73d8cd)), closes [#49](https://github.com/flint-fyi/flint/issues/49)

## [0.8.0](https://github.com/flint-fyi/flint/compare/0.7.0...0.8.0) (2025-06-13)

### Features

- implemented initial --fix mode ([#74](https://github.com/flint-fyi/flint/issues/74)) ([30891a9](https://github.com/flint-fyi/flint/commit/30891a95718e83b3aab66471f5955b5110df881c)), closes [#69](https://github.com/flint-fyi/flint/issues/69)

## [0.7.0](https://github.com/flint-fyi/flint/compare/0.6.0...0.7.0) (2025-06-13)

### Features

- extract languages concept with TypeScript ([#72](https://github.com/flint-fyi/flint/issues/72)) ([4596862](https://github.com/flint-fyi/flint/commit/45968626000f36a1bb09b3fb6b7a0b61fe9234d6)), closes [#42](https://github.com/flint-fyi/flint/issues/42)

## [0.6.0](https://github.com/flint-fyi/flint/compare/0.5.0...0.6.0) (2025-06-12)

### Features

- add --help and --version to CLI ([#71](https://github.com/flint-fyi/flint/issues/71)) ([2943004](https://github.com/flint-fyi/flint/commit/2943004f694d980ec3ed2211c5e60d5af1bc5736)), closes [#58](https://github.com/flint-fyi/flint/issues/58)

## [0.5.0](https://github.com/flint-fyi/flint/compare/0.4.0...0.5.0) (2025-06-12)

### Features

- expanded rule report data ([#70](https://github.com/flint-fyi/flint/issues/70)) ([b1e0b9a](https://github.com/flint-fyi/flint/commit/b1e0b9a212036bef2823489cde6dcb70a249a011)), closes [#60](https://github.com/flint-fyi/flint/issues/60)

## [0.4.0](https://github.com/flint-fyi/flint/compare/0.3.0...0.4.0) (2025-06-12)

### Features

- added initial CLI ([#24](https://github.com/flint-fyi/flint/issues/24)) ([5647009](https://github.com/flint-fyi/flint/commit/5647009b48c96617eb3231cb1c894a6ae3d00a32)), closes [#38](https://github.com/flint-fyi/flint/issues/38)

## [0.3.0](https://github.com/flint-fyi/flint/compare/0.2.0...0.3.0) (2025-05-22)

### Features

- rules with options or type checking, with passing unit tests ([e6aa4f5](https://github.com/flint-fyi/flint/commit/e6aa4f5dadb27dccbd89499049a54fd8d5915f51))

## [0.2.0](https://github.com/flint-fyi/flint/compare/f411df5890399bc62e1794e6839562e6c1bd131d...0.2.0) (2025-05-22)

### Features

- initialized repo ✨ ([f411df5](https://github.com/flint-fyi/flint/commit/f411df5890399bc62e1794e6839562e6c1bd131d))

### Bug Fixes

- add bin and correct README.md from template ([6a0eefa](https://github.com/flint-fyi/flint/commit/6a0eefa3e8e625704b0bb547bf5c83512388974f))
- bump package to 0.1.0, so it'll publish as 0.1.1 ([84014be](https://github.com/flint-fyi/flint/commit/84014beb2ab4da1fc7b23cb8a0fc113bbbcb5c52))

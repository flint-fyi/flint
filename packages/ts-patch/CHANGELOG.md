# @flint.fyi/ts-patch

## 0.17.0

### Minor Changes

- [#3366](https://github.com/flint-fyi/flint/pull/3366) [`9372aeb`](https://github.com/flint-fyi/flint/commit/9372aeb77826b628a7d6d6013786bcbb85fd5a4b) - Raised the minimum supported TypeScript version to 6.0.3, removing remaining TypeScript 5 support.

## 0.16.0

### Minor Changes

- [#3168](https://github.com/flint-fyi/flint/pull/3168) [`5d98e15`](https://github.com/flint-fyi/flint/commit/5d98e15aa3aefbd3eaf6df6b4b9ead019a7d1c34) - Drop support for node versions <26.1.0.

## 0.15.0

### Minor Changes

- [#3118](https://github.com/flint-fyi/flint/pull/3118) [`c737600`](https://github.com/flint-fyi/flint/commit/c7376006022dc527a18e5ab433b81fb9687bdf20) - Begin bundling all package entry points.

## 0.14.0

### Minor Changes

- [#3064](https://github.com/flint-fyi/flint/pull/3064) [`1f71b3e`](https://github.com/flint-fyi/flint/commit/1f71b3ef2d31dbe39ff8c967887801912fb28573) - Removed support for TypeScript 5.

## 0.13.5

### Patch Changes

- 2e393a1: fix(ts-patch): don't require program proxy, use utils directly from globalThis

## 0.13.4

### Patch Changes

- 602c75c: chore: rework packaging with tsdown

## 0.13.3

### Patch Changes

- 6541550: fix(ts-patch): support `Buffer` sources in hooks patching
- edf1e47: fix(ts-patch): export setTSProgramCreationProxy and setTSExtraSupportedExtensions functions

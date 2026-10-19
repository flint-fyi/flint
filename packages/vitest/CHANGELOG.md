# @flint.fyi/vitest

## 0.4.5

### Patch Changes

- [#3635](https://github.com/flint-fyi/flint/pull/3635) [`4f31391`](https://github.com/flint-fyi/flint/commit/4f3139156cd3f8be5c4ab77ff856ddf32d4f4f7c) - Recognize Vitest functions called with string literal element access modifiers, such as `test["skip"]()`, in Vitest rules.

- [#3652](https://github.com/flint-fyi/flint/pull/3652) [`82f7132`](https://github.com/flint-fyi/flint/commit/82f7132151fa11255ea0c8b85dfc52ab84cd70ad) - Stop recognizing uninvoked Vitest factories, such as `test.runIf(true)`, and unknown invoked members, such as `test.nonsense([1])()`, as Vitest functions in Vitest rules.
  Only recognize members that exist on each kind of Vitest function, so calls such as `test.shuffle()`, `describe.fails()`, and `beforeEach.skip()` are no longer treated as Vitest functions.
  Count test cases created through `test.extend()` and `test.scoped()`, such as `test.extend({})("name", () => {})`, as test cases in `hooksBeforeTestCases`.

- [#3643](https://github.com/flint-fyi/flint/pull/3643) [`ce2797f`](https://github.com/flint-fyi/flint/commit/ce2797f554644aaa191c1a9078ba9d440f54cab5) - Recognize Vitest functions called with non-null assertions, such as `test!()` and `test.each([1])!()`, in Vitest rules.

- [#3650](https://github.com/flint-fyi/flint/pull/3650) [`0079050`](https://github.com/flint-fyi/flint/commit/007905056b05b28c3f12226a10b755e1ae4b76d2) - Added a `toHaveLengthMatchers` rule.
- Updated dependencies [[`3374e11`](https://github.com/flint-fyi/flint/commit/3374e115105d2ca9f9cbad33cd3af9b93b1d0929)]:
  - @flint.fyi/core@0.30.0

## 0.4.4

### Patch Changes

- [#3608](https://github.com/flint-fyi/flint/pull/3608) [`b6b9974`](https://github.com/flint-fyi/flint/commit/b6b99741bd640754fc225d7a36bef7240554a87e) - Recognize `aroundAll`, `aroundEach`, and `suite` functions and the `shuffle` modifier in Vitest rules.
  Remove the `fit`, `xit`, and `xtest` names not in Vitest.
- Updated dependencies [[`3ff15cf`](https://github.com/flint-fyi/flint/commit/3ff15cf29201a838766dd14164b19909d9921589), [`59363bf`](https://github.com/flint-fyi/flint/commit/59363bf3d0d4d14e42ab67905144ff5613e0b2a5), [`f5032e7`](https://github.com/flint-fyi/flint/commit/f5032e72ee57e42bd30561a5ba08bc674b89b001), [`a13eac8`](https://github.com/flint-fyi/flint/commit/a13eac87040f4034baf58f58cba7724e870c81d9), [`6c67694`](https://github.com/flint-fyi/flint/commit/6c6769446362489d64d4351b7428bed783f79dab)]:
  - @flint.fyi/utils@0.17.0
  - @flint.fyi/core@0.29.0

## 0.4.3

### Patch Changes

- [#3533](https://github.com/flint-fyi/flint/pull/3533) [`663916f`](https://github.com/flint-fyi/flint/commit/663916fb3753c8157848fb0894c22cc2655bcf4f) - Export the package's `package.json`.
- Updated dependencies [[`ac7c65d`](https://github.com/flint-fyi/flint/commit/ac7c65d0ca4500a7b38fb4fe0dbda600d99d0c39), [`12ad54b`](https://github.com/flint-fyi/flint/commit/12ad54bb504f1c54d215f9b6041fe8a79c263faf), [`c049ab9`](https://github.com/flint-fyi/flint/commit/c049ab9a74c48b2a3c75c2aac26ca33b99a3d6a3), [`663916f`](https://github.com/flint-fyi/flint/commit/663916fb3753c8157848fb0894c22cc2655bcf4f), [`2df6b52`](https://github.com/flint-fyi/flint/commit/2df6b526d4d503e1f2649a092486c7d540d8adda), [`b492077`](https://github.com/flint-fyi/flint/commit/b49207771a419030c8564a90a468f8f82841f9db)]:
  - @flint.fyi/core@0.28.0

## 0.4.2

### Patch Changes

- Updated dependencies [[`9372aeb`](https://github.com/flint-fyi/flint/commit/9372aeb77826b628a7d6d6013786bcbb85fd5a4b), [`6a34cee`](https://github.com/flint-fyi/flint/commit/6a34cee256df6c575793bd9ab8b094ed06e0efe4), [`a32109c`](https://github.com/flint-fyi/flint/commit/a32109c1ef55226efd1c05b853a9651c4d4ece6b), [`b071991`](https://github.com/flint-fyi/flint/commit/b0719910c991f7b4b986062ccb182d31722c9fe2), [`fb6ceba`](https://github.com/flint-fyi/flint/commit/fb6ceba45d56c32294e27afff078736ac8e12e07), [`8950424`](https://github.com/flint-fyi/flint/commit/8950424bd54371e56344eff50f752aba1e5752a3), [`07f1ca7`](https://github.com/flint-fyi/flint/commit/07f1ca70461eff08d4bd096ca5d14f2f82dffc68), [`f02543b`](https://github.com/flint-fyi/flint/commit/f02543b8a418ae793b1b0ead1542db899486e7aa)]:
  - @flint.fyi/typescript-language@0.21.0
  - @flint.fyi/core@0.27.0

## 0.4.1

### Patch Changes

- [#3125](https://github.com/flint-fyi/flint/pull/3125) [`9d60a92`](https://github.com/flint-fyi/flint/commit/9d60a925bdc5b8a70ddb99904066761a71f3d40a) - Added a `conditionalExpects` rule.

- [#3125](https://github.com/flint-fyi/flint/pull/3125) [`9d60a92`](https://github.com/flint-fyi/flint/commit/9d60a925bdc5b8a70ddb99904066761a71f3d40a) - Added `hooksBeforeTestCases` rule.
- Updated dependencies [[`7d6522c`](https://github.com/flint-fyi/flint/commit/7d6522cf53a5c7f9cf7823cf255e1cbdfef511a3), [`5b63f69`](https://github.com/flint-fyi/flint/commit/5b63f6901ff0d6cfabe4dbf61cb3f0333dc94602)]:
  - @flint.fyi/core@0.26.0

## 0.4.0

### Minor Changes

- [#3168](https://github.com/flint-fyi/flint/pull/3168) [`5d98e15`](https://github.com/flint-fyi/flint/commit/5d98e15aa3aefbd3eaf6df6b4b9ead019a7d1c34) - Drop support for node versions <26.1.0.

### Patch Changes

- Updated dependencies [[`5d98e15`](https://github.com/flint-fyi/flint/commit/5d98e15aa3aefbd3eaf6df6b4b9ead019a7d1c34), [`3f8e15d`](https://github.com/flint-fyi/flint/commit/3f8e15d092d0177bcbf0de75718a075bf5fb4c21)]:
  - @flint.fyi/typescript-language@0.20.0
  - @flint.fyi/core@0.25.0

## 0.3.0

### Minor Changes

- [#3118](https://github.com/flint-fyi/flint/pull/3118) [`c737600`](https://github.com/flint-fyi/flint/commit/c7376006022dc527a18e5ab433b81fb9687bdf20) - Begin bundling all package entry points.

### Patch Changes

- Updated dependencies [[`c737600`](https://github.com/flint-fyi/flint/commit/c7376006022dc527a18e5ab433b81fb9687bdf20)]:
  - @flint.fyi/typescript-language@0.19.0
  - @flint.fyi/core@0.24.0

## 0.2.0

### Minor Changes

- [#3064](https://github.com/flint-fyi/flint/pull/3064) [`1f71b3e`](https://github.com/flint-fyi/flint/commit/1f71b3ef2d31dbe39ff8c967887801912fb28573) - Removed support for TypeScript 5.

## 0.1.3

### Patch Changes

- [#2899](https://github.com/flint-fyi/flint/pull/2899) [`9c8cea0`](https://github.com/flint-fyi/flint/commit/9c8cea054d271af189101fc340d1da85fc7dc886) - Remove `*PaddingLines` rules from presets.

- Updated dependencies [[`5ee9a84`](https://github.com/flint-fyi/flint/commit/5ee9a8413b7a47cad3569a7df185f6e5e198908f)]:
  - @flint.fyi/core@0.23.0

## 0.1.2

### Patch Changes

- Updated dependencies [61076ad]
  - @flint.fyi/core@0.22.0

## 0.1.1

### Patch Changes

- 6f2a1b2: Added testCasesWithinDescribes rule.
- 8eed0f6: Added remaining \*Padding\* rules.
- 3eee30e: Added `afterAllPaddingLines` rule.

## 0.1.0

### Minor Changes

- 9cdc819: Added initial Vitest plugin with `nodeTestImports` rule.

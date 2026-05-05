# Copilot Instructions

This repository has a very strict style guide.
Existing patterns in code and on github.com are generally very intentional (unless indicated otherwise) and must be respected.

## Builds & scripts

You should have done the steps in `.github/workflows/copilot-setup-steps.yml` to start development.
Most importantly, it should have had you use Node.js 24, run `pnpm install`, then run `pnpm build --noCheck` and `run pnpm -r prebuild`.
Do this before you run any other scripts such as `lint` or `test`.

If you see failures in things you didn't touch, such as cross-rule unit test failures when you only changed one rule, it's probably that your dev environment isn't on Node.js 24 and/or you didn't build.

Read `AGENTS.md`, `package.json`, and `.github/DEVELOPMENT.md` for further dev instructions.

## Pull Requests

**Make sure all scripts are passing before considering work done**!
All `package.json` scripts that will be run in CI should pass: `pnpm build`, `pnpm lint`, `pnpm flint`, `pnpm lint:knip`, `pnpm lint:knip:prod` and `pnpm dedupe --check --prefer-offline`.

If you've made any code/file changes, re-run all those scripts to validate they pass _before_ re-requesting review.

### Artifacts

It's ok if you write one-of scripts to test rules (e.g. `debug__test.mjs`) but don't check them into Git or include them in PRs.

If your changes to built files (`.json`, `.ts`, other TSConfig includes) are only within one package, you don't need to re-build before running tests.
As long as you built once before the changes it's fine.

Don't include changes to unrelated files or areas of files.
Example: if changing `packages/comparisons/src/data.json` to add `implemented: true`, don't include unrelated newlines and spacing unless required by the formatter.

### PR Description

Use this repository's `.github/PULL_REQUEST_TEMPLATE.md` pull request template for the PR description, including `[x]`-checked task list items.

Don't exhaustively list everything you do in the PR description > Overview.
1-2 sentences is fine.
If there are important differences between this rule and other linter implementation(s), you can briefly mention them.

### PR Title

Use conventional commit format for PR titles.
Example: `feat: implement myRuleName for TypeScript plugin`.

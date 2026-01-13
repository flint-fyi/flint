# Copilot Instructions

This repository has a very strict style guide.
Existing patterns in code and on github.com are generally very intentional (unless indicated otherwise) and must be respected.

## Builds & scripts

You should have done the steps in `.github/workflows/copilot-setup-steps.yml` to start development.
Most importantly, it should have had you use Node.js 24, run `pnpm install`, then run `pnpm build --noCheck` and `run pnpm -r prebuild`.
Do this before you run any other scripts such as `lint` or `test`.

If you see failures in things you didn't touch, such as cross-rule unit test failures when you only changed one rule, it's probably that your dev environment isn't on Node.js 24 and/or you didn't build.

Read `package.json` and `.github/DEVELOPMENT.md` for further dev instructions.

## Code style

Always prefer implicit/inferred return types.
Only add them to solve a TypeScript type-checking complaint or similar.

Prefer early-returns except when there's only one conditional in a function.
Example: prefer `const x = getX(); if (!x) { return; } ...` over `const x = getX(); if (x) { ... }`.

Prefer `undefined` over `null`.

Don't abbreviate names.
Example: instead of `val`/`vals` prefer `value`/`values`.

Only add comments rarely and sparingly.
Example: don't restate things that are either implied by the type system or apparent by reading the next few lines.

In large lists such as `plugins.ts` `rules`, keep things alphabetical.

In JSON files such as the comparisons data.json, even if they're not linted to stay alphabetical, keep them alphabetical (excluding `package.json` files).

When a variable is only used once, prefer to inline it unless it includes multiple logical operands

### Utilities

Whenever you want to implement a helper/utility method, first check if an equivalent exists in the `typescript` package, or failing that `ts-api-utils`.

## Documentation

Markdown files should try to limit to one sentence per line.
If a paragraph has multiple sentences, try to start each on a new line.
This `.github/copilot-instructions.md` file is a good example of that.

The `description` frontmatter property in `.mdx` rule docs files should match their rule's `rule.meta.about`.

Don't be vague in documentation.
Be precise.
Example: instead of saying "can cause problems", say what those problems are.

Add a Further Reading section to the docs with at least one, ideally multiple, links.
Don't include links to other linters in Further Reading -- prefer links to general known high quality resources such as MDN.

Code snippets should look like they pass the repo's type-checking and linting.
Example: don't violate ESLint's no-unused-vars for function parameters or variables, nor TypeScript's noImplicitAny.

Don't mention very old legacy points unless they're relevant to a rule.
Example: don't mention behavior differences in strict mode vs. non-strict mode unless the changed logic actually intersects with stuff differently between the two.

Don't say "easily", "simply", or equivalent words or phrases.
Nothing is simple to everyone.
Example: don't say "If ABC, just do XYZ" - that "just" implies things are easy or simple.

Never say "This rule should always be enabled." or similar.
But also don't suggest allowing inaccessible frontends or other bad practices.
You should always suggest a legitimate reason not to use it.
For stylistic rules that might be that the user already has a large difficult-to-refactor project.
For JSX/accessibility rules it might be that they have a framework doing it for them.
See existing rule docs for examples of alternatives / edge cases.

In Incorrect and Correct tabs, use a separate ts code snippet per case.Don't put all cases in a single snippet.

## Lint Rules

Prefer targeted report ranges when possible.
Example: if an issue is with specific characters in a literal, don't report the whole node; report the smallest range that includes those characters.

Set the plugin, such as `"logical"` or `"untyped"`, that they correspond to in the comparisons data.

If two node visitor functions have roughly the same body text, try to extract to a helper function.

Rule report messages should not be prescriptive "don't X".
They should focus on educating on what the problem is, not just directly saying the preferred approach.
Instead, lean towards "do X".
Example: instead of messages like _"Octal escape sequences should not be used in string literals."_, use messages like _"Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences."_.

When you have an `AST.Expression` or `AST.*Declaration`, check whether nodes are certain types using a comparision like `node.kind === ts.SyntaxKind.BinaryExpression`.
When you have a `ts.Node` type, however, you'll have to use `ts.is*` checks such as `ts.isBinaryExpression`, or failing that `tsutils` from `ts-api-utils` to get nice type narrowing.

Always pass source files to `node.getStart(sourceFile)` - don't just call `node.getStart()`.
Same with other TypeScript APIs that optionally take in a sourceFile.

Don't use `node.getText(sourceFile)` APIs to check if two nodes are equivalent.
Use `hasSameTokens` or similar.

### Lint Rule Unit Tests

> Tip: to re-run just the tests for a rule, run `npx vitest run <rulename>`.
> Example: to rerun tests for the `unnecessaryCatches` rule, run `npx vitest run unnecessaryCatches`.

Look at other rule tests and try to mirror their layouts and styles as much as possible.

Make sure each piece of logic in a rule is unit tested.
If removing a piece of logic doesn't fail unit tests, that's likely as sign you're missing unit testing some edge case.
If you can't find an edge case that requires the logic, then remove that logic.
Example: if removing `ts.isIdentifier(node.parent) &&` from an if statement doesn't fail unit tests, then maybe you're not testing the case of a non-identifier node parent? If that's possible, add those test case(s).
If that's not possible, remove the logic.

Don't use tabs in template literal strings.
Indent with four spaces.

If `valid` test cases can be collapsed to one line, they should be.

Start all `invalid` test case code after the first line (i.e. `snapshot:` and then newline), so that snapshot `~`s visually show up underneath the flagged characters of code.

Don't use foo/bar/etc. names.
Use succinct descriptive ones instead.
Example: instead of `let foo;` use `let value;`.
Instead of `foo-.-bar` use `before-.-after`.

If a rule has fixes and/or suggestions, those should be tested in unit tests.

### JSX Rules

For JSX rules, don't check `dangerouslySetHTML` - that's React-specific.

Don't abbreviate attribute names to `attr` - prefer `attributes`.
Also, if something is based on `node.attribute.properties`, call it `property`, not `attr` or `prop`.

## Pull Requests

**Make sure all scripts are passing before considering work done**!
All `package.json` scripts that will be run in CI should pass: `pnpm build`, `pnpm lint`, `pnpm flint`, `pnpm lint:knip`, and `pnpm lint:packages`.

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

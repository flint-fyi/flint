# Flint Development Guidelines

## Code Style

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
But also don't suggest allowing inaccessible frontend UIs or other bad practices.
You should always suggest a legitimate reason not to use it.
For stylistic rules that might be that the user already has a large difficult-to-refactor project.
For JSX/accessibility rules it might be that they have a framework doing it for them.
See existing rule docs for examples of alternatives / edge cases.

In Incorrect and Correct tabs, use a separate ts code snippet per case.
Don't put all cases in a single snippet.

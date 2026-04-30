---
name: implementing-lint-rules
description: "Implements ESLint-style lint rules with proper AST handling, targeted reporting, and comprehensive unit tests. Use when creating new lint rules or modifying existing rule implementations."
---

# Implementing Lint Rules

Patterns and practices for implementing lint rules in Flint.

## Reporting

Prefer targeted report ranges when possible.
Example: if an issue is with specific characters in a literal, don't report the whole node; report the smallest range that includes those characters.

Set the plugin, such as `"logical"` or `"javascript"`, that they correspond to in the comparisons data.

If two node visitor functions have roughly the same body text, try to extract to a helper function.

## Messages

Rule report messages should not be prescriptive "don't X".
They should focus on educating on what the problem is, not just directly saying the preferred approach.
Instead, lean towards "do X".
Example: instead of messages like _"Octal escape sequences should not be used in string literals."_, use messages like _"Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences."_.

## AST Node Handling

When you have an `AST.Expression` or `AST.*Declaration`, check whether nodes are certain types using a comparision like `node.kind === ts.SyntaxKind.BinaryExpression`.

When you have a `ts.Node` type, however, you'll have to use `ts.is*` checks such as `ts.isBinaryExpression`, or failing that `tsutils` from `ts-api-utils` to get nice type narrowing.

Always pass source files to `node.getStart(sourceFile)` - don't just call `node.getStart()`.
Same with other TypeScript APIs that optionally take in a sourceFile.

Don't use `node.getText(sourceFile)` APIs to check if two nodes are equivalent.
Use `hasSameTokens` or similar.

## Unit Tests

> Tip: to re-run just the tests for a rule, run `npx vitest run <rulename>`.
> Example: to rerun tests for the `unnecessaryCatches` rule, run `npx vitest run unnecessaryCatches`.

Look at other rule tests and try to mirror their layouts and styles as much as possible.

Make sure each piece of logic in a rule is unit tested.
If removing a piece of logic doesn't fail unit tests, that's likely a sign you're missing unit testing some edge case.
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

## JSX Rules

For JSX rules, don't check `dangerouslySetHTML` - that's React-specific.

Don't abbreviate attribute names to `attr` - prefer `attributes`.
Also, if something is based on `node.attribute.properties`, call it `property`, not `attr` or `prop`.

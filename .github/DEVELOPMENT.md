# Development

After [forking the repo from GitHub](https://help.github.com/articles/fork-a-repo) and [installing pnpm](https://pnpm.io/installation):

```shell
git clone https://github.com/(your-name-here)/flint
cd flint
pnpm install
```

> This repository includes a list of suggested VS Code extensions.
> It's a good idea to use [VS Code](https://code.visualstudio.com) and accept its suggestion to install them, as they'll help with development.

## Building

Run TypeScript's builder mode locally to build source files from `src/` into output files in `lib/`:

```shell
pnpm build
```

Add `--watch` to run the builder in a watch mode that continuously recreates `lib/` as you save files:

```shell
pnpm build --watch
```

## Formatting

[Prettier](https://prettier.io) is used to format code.
It should be applied automatically when you save files in VS Code or make a Git commit.

To manually reformat all files, you can run:

```shell
pnpm format --write
```

## Linting

This package includes several forms of linting to enforce consistent code quality and styling.
Each should be shown in VS Code, and can be run manually on the command-line:

- `pnpm lint` ([ESLint](https://eslint.org) with [typescript-eslint](https://typescript-eslint.io)): Lints JavaScript and TypeScript source files
- `pnpm lint:knip` ([knip](https://github.com/webpro/knip)): Detects unused files, dependencies, and code exports
- `pnpm lint:packages` ([pnpm dedupe --check](https://pnpm.io/cli/dedupe)): Checks for unnecessarily duplicated packages in the `pnpm-lock.yaml` file

Read the individual documentation for each linter to understand how it can be configured and used best.

For example, ESLint can be run with `--fix` to auto-fix some lint rule complaints:

```shell
pnpm run lint --fix
```

Note that you'll need to run `pnpm build` before `pnpm lint` so that lint rules which check the file system can pick up on any built files.

## Testing

[Vitest](https://vitest.dev) is used for tests.
You can run it locally on the command-line:

```shell
pnpm run test
```

Note that [console-fail-test](https://github.com/JoshuaKGoldberg/console-fail-test) is enabled for all test runs.
Calls to `console.log`, `console.warn`, and other console methods will cause a test to fail.

### Debugging Tests

This repository includes a [VS Code launch configuration](https://code.visualstudio.com/docs/editor/debugging) for debugging unit tests.
To launch it, open a test file, then run _Debug Current Test File_ from the VS Code Debug panel (or press F5).

## Common Contributing Tasks

The following sections detail common tasks you may want to perform when contributing to Flint.

### Writing a New Rule

> [!TIP]
> Search for an existing rule with a similar purpose to see all the places it's referenced.

To add a new rule, `{ruleName}` to an existing Flint plugin `{plugin}`:

1. Create the following files, copying contents from an existing rule as a starting point:
   - `packages/{plugin}/src/rules/{ruleName}.ts`
   - `packages/{plugin}/src/rules/{ruleName}.test.ts`
   - `packages/site/src/content/docs/rules/{plugin}/{ruleName}.mdx`
2. Updating existing files that reference rules:
   - `packages/{plugin}/src/plugin.ts`: adding the rule in alphabetical order to `rules`
   - `packages/comparisons/src/data.json`: marking the rule as `"status": "implemented"`
3. Try to follow these best practices when writing the rule's documentation and tests:
   - In documentation, see the sections present in other rules and fill them out
     - In _Further Reading_ documentation, find at least one first-party source such as MDN
     - _When Not To Use It_ should not say to always use the rule; instead, think of at least one legitimate reason - even if it's legacy runtimes
   - In tests, use as straightforward code snippets as possible, preferring generic names like `value` over references like `foo`/`bar`

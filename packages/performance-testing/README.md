<h1 align="center"><code>@flint.fyi/performance-testing</code></h1>

<p align="center">
	Runs performance measurements for Flint and other linters.
	❤️‍🔥
</p>

> Requires [hyperfine](https://github.com/sharkdp/hyperfine#installation) to be installed globally.

## Running Performance Testing

From the repository root, create Flint's publishable artifacts with:

```shell
pnpm build
pnpm --filter-prod flint... pack
```

Then in this `packages/performance-testing` directory:

```shell
pnpm generate
pnpm measure
```

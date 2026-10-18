<h1 align="center"><code>@flint.fyi/performance-testing</code></h1>

<p align="center">
	Runs performance measurements for Flint and other linters.
	❤️‍🔥
</p>

> Requires [Hyperfine 2](https://github.com/sharkdp/hyperfine/releases/tag/v2.0.0) to be installed globally (`hyperfine --version`).
> Native memory measurements require Linux or macOS; Windows reports memory as unavailable.

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

## Measurements

Each linter runs sequentially in fresh processes without an intermediate shell, with one unmeasured warmup and Hyperfine's automatic measured run count.
The harness resolves each package's declared `bin` from the generated consumer directory before measuring, then invokes it with the current Node.js executable without a package-manager wrapper.
The measured wall-clock time includes Node.js startup and linting; this is not an in-process steady-state benchmark.
Flint's persistent cache is disabled to match ESLint's uncached runs.
All nine generated file/rule combinations are measured against the same source files and corresponding rule configurations.

The table shows mean wall-clock time and standard deviation in milliseconds, and mean per-run peak resident set size (RSS) and standard deviation in MiB (1,048,576 bytes).
The time delta is `(Flint mean / ESLint mean - 1) × 100%`, calculated from unrounded seconds; negative values favor Flint.
RSS measures physical resident memory, not JavaScript heap allocation or total process-tree memory.
On Linux/macOS it is the largest per-process peak among the command and children whose usage is collected when their parents wait for them.
Linux can report an inherited startup RSS floor for very small commands.
Missing memory is shown as `unavailable`, not zero; a single measured run has no standard deviation.

Raw schema-version-2 JSON is retained at `cases/<case>/<ESLint|Flint>.hyperfine.json`, overwritten by each measurement and removed by `pnpm generate`.
It includes Hyperfine version/platform metadata, per-run measurements and exit codes, and statistical summaries.
JSON times are seconds and memory values are bytes regardless of terminal display units.
Nonzero linter exits are permitted because fixtures intentionally produce diagnostics; inspect output and exported exit codes to distinguish expected lint reports from broken invocations.
Hyperfine execution errors stop measurement.

For reproducible comparisons, record the source revision, Node.js/pnpm/Hyperfine versions, platform, commands, and raw exports.
Validate diagnostics outside the timed runs, keep inputs and flags identical, and avoid competing workloads.
For build-to-build comparisons, alternate baseline/candidate order across rounds and run identical-build controls to estimate noise before interpreting a difference.
Inspect individual samples before aggregating; these measurements alone do not establish a performance improvement.

## Further Reading

- [Hyperfine metrics and platform semantics](https://github.com/sharkdp/hyperfine/tree/v2.0.0#choosing-metrics-and-units)
- [Hyperfine 2 release and JSON schema](https://github.com/sharkdp/hyperfine/releases/tag/v2.0.0)
- [JavaScript optimization measurement workflow](https://github.com/webpro/skills/blob/main/skills/optimize-javascript/SKILL.md)

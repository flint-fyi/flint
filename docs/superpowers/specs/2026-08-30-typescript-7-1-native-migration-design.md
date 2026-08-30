# TypeScript 7.1 Native Migration Design

## Summary

Flint will replace its TypeScript 5/6 compiler integration with the native TypeScript 7.1 API.
This is a clean break rather than a dual-engine transition.
The migration must preserve existing lint behavior for TypeScript, JavaScript, Astro, Svelte, and Vue files while intentionally redesigning Flint's TypeScript-specific rule-author API around native snapshots, projects, AST nodes, and checker handles.

Implementation will begin against an exact TypeScript 7.1 nightly and follow the beta and release-candidate stabilization milestones.
The native Flint major will not be published before TypeScript 7.1 is stable.

## Goals

- Run Flint's type-aware lint engine on the TypeScript 7.1 native API.
- Drop TypeScript 5 and 6 runtime support.
- Preserve all existing rules, diagnostics, fixes, directives, cache behavior, and source ranges unless TypeScript 7.1 has a verified semantic difference.
- Preserve Astro, Svelte, and Vue linting through TypeScript content mappers.
- Replace the legacy rule-author API with direct native TypeScript concepts.
- Provide local discriminated AST unions equivalent to TypeScript PR #64040 until TypeScript exports them.
- Measure and protect Flint's startup, incremental, and lint performance across the process boundary.

## Non-Goals

- Shipping a compatibility layer that emulates TypeScript 6's `Node`, `Program`, `TypeChecker`, or ProjectService APIs.
- Supporting TypeScript 5/6 and 7.1 in the same Flint release.
- Temporarily removing rules or embedded-language support to accelerate the cutover.
- Depending on private TypeScript protocol or Go implementation details.
- Guaranteeing TypeScript's advertised compiler speedup applies directly to every Flint workload.

## Approach

The work will use a staged native rewrite with one final release cutover.
Each stage will establish a tested native boundary before dependent rules or languages move to it.
The repository may contain temporary migration states during development, but no published package will expose a dual engine.

A big-bang rewrite would make failures across hundreds of TypeScript imports difficult to isolate.
A TypeScript 6 compatibility facade would conceal snapshot lifetimes, encourage excessive process-boundary calls, and preserve APIs that TypeScript 7.1 intentionally replaced.

## Core Architecture

```text
┌─────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│ Flint host  │────▶│ TS 7.1 API session│────▶│ Snapshot / projects │
│ + file cache│     │ + delegated VFS   │     │ programs / checkers │
└──────┬──────┘     └───────────────────┘     └──────────┬──────────┘
       │                                                  │
       │ framework source                                 │ native AST handles
       ▼                                                  ▼
┌─────────────────┐                              ┌───────────────────┐
│ Content mappers │                              │ Flint rule runtime│
│ Astro/Svelte/Vue│                              │ native rule API   │
└─────────────────┘                              └───────────────────┘
```

`@flint.fyi/typescript-language` will own one long-lived synchronous TypeScript API session per Flint language factory.
Flint's `LinterHost` will implement the native delegated filesystem boundary.
Native snapshot updates will replace ProjectService client-file and watcher management.

Each linted file will resolve to a native snapshot, project, program, source file, and checker.
Rules will receive those native values through a redesigned file-services contract.
Individual rules will not spawn API sessions, update snapshots, or dispose shared native state.

Diagnostics will be collected from the native program's diagnostic methods rather than `getPreEmitDiagnostics`.
The migration will delete `@typescript-eslint/project-service`, `@flint.fyi/ts-patch`, and legacy `typescript` API imports instead of wrapping them.

## Snapshot and Project Lifecycle

One Flint run will use this lifecycle:

1. Start the native API session with Flint's delegated filesystem and external mapper execution enabled.
2. Discover user projects and create virtual overlay configurations for active embedded-language mappers.
3. Create or update a snapshot after source or configuration changes.
4. Resolve each input file to its default project.
5. Retrieve its canonical source file and any supplemental mapped source files.
6. Collect diagnostics and run rule visitors while the snapshot is active.
7. Translate ranges, apply directives, and record cache dependencies.
8. Dispose file-scoped state, superseded snapshots, and finally the API session.

Nodes, symbols, types, signatures, checkers, and projects are snapshot-scoped.
Flint and its rules must not retain them after that snapshot is superseded or disposed.

Changes to user configuration, mapper options, mapper package identity, or dynamically watched framework configuration will invalidate the affected native project state.
Unrelated projects will retain their incremental state.

## Native Rule API

The TypeScript file-services contract will expose the active native `snapshot`, `project`, `program`, `sourceFile`, `checker`, and optional `spanMap`.
This API is intentionally breaking and will not preserve legacy TypeScript object types.

Flint will retain visitor-based rule ergonomics.
Visitor keys and parameter types will instead derive from native AST kinds and Flint's local discriminated unions.

The 46 current `ts-api-utils` call sites will be replaced with native TypeScript utilities when equivalents exist.
Shared Flint utilities will be introduced only for behavior used by multiple callers.
One-use checks will remain local to their rules.

Rules will move in dependency order:

1. Traversal, ranges, directives, and scope analysis.
2. Syntax-only rules.
3. Symbol and type utilities.
4. Type-aware rules.
5. Cross-file and framework-aware rules.

Existing messages, fixes, report ordering, and source ranges form the behavioral parity contract.

## Discriminated AST Unions

TypeScript 7.1 does not yet export the discriminated AST union proposed in TypeScript PR #64040.
Flint will provide an equivalent checked-in generated module until that upstream work is available.

The module will export discriminated unions for `Node`, `Expression`, `Statement`, `TypeNode`, `Declaration`, and every additional category required by Flint rules.
Union members will reference TypeScript's concrete native interfaces instead of copying their fields.

The generator will:

- Build category membership from transitive native AST inheritance.
- Include one node in every category it belongs to.
- Build `Node` from the complete concrete-node set rather than combining narrower categories.
- Include aliased `SyntaxKind` discriminants.
- Handle generic and multi-kind node variants.
- Define explicit special unions such as `UnaryExpression` where the native base does not narrow correctly.
- Produce deterministic, checked-in output.

A parity test will fail when the installed TypeScript version adds or changes a concrete node or kind without a corresponding Flint union update.
Native type guards will be wrapped with local predicate annotations only when their current upstream return type is too broad for the local union.

When TypeScript publishes equivalent unions, Flint will remove the local generator and use the upstream exports.

## Embedded Languages

TypeScript 7.1 content mappers are the official replacement for the createProgram and TS Server plugin techniques currently used by Flint and Volar.
Flint will replace its compiler patch with mapper processes implementing the upstream `initialize`, `openProject`, `transform`, and `closeProject` lifecycle.

Each embedded-language integration will have two responsibilities:

1. A content mapper that returns transformed TypeScript, supplemental outputs, diagnostics, directives, and span mappings.
2. A Flint-side context provider that parses the original file and supplies framework-specific rule data.

The context provider will preserve data currently used by framework-native rules, including Astro's compiler AST, Svelte's parsed AST and source text, and Vue's SFC and code-generation metadata.
Type-aware portions of those rules will consume the native TypeScript services.

Existing Volar-based code generation may be reused inside mapper implementations when it can produce conforming, stable mappings.
Flint will not retain Volar's TypeScript program proxy.

Vize implements the upstream content-mapper protocol for Vue and is the preferred Vue mapper.
Flint will adopt Vize if packed-package conformance tests verify required mappings, directives, options, diagnostics, and supplemental-file behavior.
If it does not meet those requirements, `@flint.fyi/vue-language` will provide a conforming mapper using its existing Vue code generation.

Astro and Svelte language packages will provide equivalent conforming mapper integrations unless maintained upstream mappers satisfy the same test contract before cutover.

### Zero-Configuration Mapper Activation

The native JavaScript API cannot inject a content mapper into an existing configured project.
Configured projects read mapper declarations from their TypeScript configuration.

Flint will preserve its current zero-configuration plugin behavior by exposing virtual overlay tsconfigs through the delegated filesystem.
Each overlay will preserve the user's resolved root files, project references, and compiler options while adding only mappers corresponding to imported Flint language plugins.
Flint will open the overlay as the native project without modifying files on disk.

Mapper package resolution and `runExternalCode` form a security boundary.
Overlays will reference only mapper executables supplied by explicitly installed and imported Flint plugins.

### Mapping and Traversal

Native `SourceFile.originalText`, `SourceFile.spanMap`, and `SourceFile.supplementalOutputs` will be the source of truth for mapped files.
Flint will traverse canonical and supplemental transformed files that correspond to one authored source file.

Diagnostics, fixes, and rule reports will translate through native span maps.
Ordinary Flint reports from generated regions without source mappings will be suppressed to preserve current behavior.
Mapper process and configuration failures will remain visible even when no generated range maps to authored source.

Content mapper processes will isolate project-specific state by project handle.
Dynamic framework configuration will use mapper configuration identities and watched files.
Flint will rely on TypeScript's content-mapper support for incremental, build, watch, and project-reference behavior rather than recreate those mechanisms.

## Failure Handling

Native process startup and protocol failures will terminate linting with an actionable Flint error.
There will be no TypeScript 6 fallback.

Invalid TypeScript configuration and mapper options will become source-positioned diagnostics.
Mapper diagnostics and crashes will use TypeScript's protocol behavior and remain visible through Flint.

Nightly or prerelease API changes will fail compatibility tests rather than be hidden by broad casts or private API access.
The migration will pin exact TypeScript prerelease versions so each API update is deliberate and reviewable.

## Verification

Before replacing the engine, Flint will capture a TypeScript 6 behavioral baseline for rule outputs, fixes, diagnostics, directives, cache impacts, and framework source ranges.

Focused contracts will cover:

- Generated AST-union exhaustiveness and narrowing.
- Snapshot invalidation and disposal.
- Project and configuration discovery.
- Diagnostic aggregation and ordering.
- Canonical and supplemental source traversal.
- Span-map translation and unmapped generated regions.
- Mapper lifecycle, options, failures, and dynamic configuration.
- Virtual overlay configuration equivalence to each source project.

Existing rule tests will remain unchanged where behavior should be identical.
Tests will change only for the intentionally redesigned public API or a documented TypeScript 7.1 semantic difference.

Packed-package integration fixtures will cover plain TypeScript, project references, JavaScript and JSDoc, Astro, Svelte, and Vue.
CI will exercise Linux, macOS, and Windows because native binaries and mapper processes are platform-sensitive.

Performance benchmarks will compare TypeScript 6 and 7.1 project startup, warm snapshot updates, type-aware linting, and embedded-language linting.
Measurements will separate native project construction, AST transfer, checker calls, mapper work, and Flint rule execution.
Regressions caused by excessive process-boundary calls or uncached delegated-filesystem access must be investigated before release.

## Delivery and Release

Development will pin an exact TypeScript 7.1 nightly.
The dependency will be updated deliberately at beta and release candidate, with compatibility changes isolated for review.

The final cutover will remove:

- `@typescript-eslint/project-service`.
- `ts-api-utils`.
- `@flint.fyi/ts-patch` and its test hooks.
- Volar createProgram interception.
- Legacy AST and checker declarations superseded by native types and the generated unions.
- TypeScript 5/6 dependency and peer ranges.

The native release will be a breaking Flint major published only after TypeScript 7.1 is stable and the complete platform and embedded-language test matrix passes.

Release documentation will explain the TypeScript 7.1 requirement, supported native platforms, mapper process execution, the new TypeScript rule API, and migration examples for third-party rules.

## Further Reading

- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [TypeScript 7.1 Iteration Plan](https://github.com/microsoft/TypeScript/issues/63703)
- [TypeScript API Feature Roadmap](https://github.com/microsoft/TypeScript/issues/63875)
- [TypeScript Content Mappers](https://github.com/microsoft/typescript-go/pull/4712)
- [TypeScript Emit API](https://github.com/microsoft/typescript-go/pull/4699)
- [Discriminated AST Union Proposal](https://github.com/microsoft/TypeScript/pull/64040)
- [Vize TypeScript Content Mapper](https://vizejs.dev/guide/content-mapper/index.html)
- [Migrating ts-loader to TypeScript 7.1](https://johnnyreilly.com/migrating-ts-loader-to-typescript-7-1-with-ai)

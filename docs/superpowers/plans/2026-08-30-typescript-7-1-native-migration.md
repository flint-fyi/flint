# TypeScript 7.1 Native Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Flint's TypeScript 5/6 integration with TypeScript 7.1's native API while preserving all rule and embedded-language behavior.

**Architecture:** `@flint.fyi/typescript-language` will own a synchronous native API session backed by Flint's filesystem and snapshot lifecycle.
Rules will use native AST/checker objects plus generated discriminated unions, while Astro, Svelte, and Vue files enter native projects through content mappers and span maps.

**Tech Stack:** TypeScript 7.1 native synchronous API, Vitest, pnpm workspaces, Volar code generation, TypeScript content-mapper protocol, Vize, Astro compiler, Svelte compiler, Vue compiler-dom.

---

## File Ownership Map

- `packages/typescript-language/src/createTypeScriptFileSystem.ts` adapts `LinterHost` to the native delegated filesystem contract.
- `packages/typescript-language/src/createTypeScriptProjectSession.ts` owns `API`, snapshots, project opens, file changes, and disposal.
- `packages/typescript-language/src/createTypeScriptOverlayConfig.ts` creates virtual project configurations with registered content mappers.
- `packages/typescript-language/src/contentMappers.ts` stores mapper registrations made by imported language plugins.
- `packages/typescript-language/src/getTypeScriptDiagnostics.ts` selects and orders native diagnostics for one source file.
- `packages/typescript-language/src/types/ast.ts` is checked-in generated discriminated AST output.
- `packages/typescript-language/scripts/generate-ast.ts` regenerates local AST unions from the installed native declarations.
- `packages/typescript-language/src/language.ts` coordinates file services, diagnostics, visitors, mappings, and framework context.
- `packages/volar-language/src/content-mapper/` contains the reusable JSON-RPC server and Volar-to-content-mapper conversion used by Astro and Svelte.
- `packages/astro-language/src/content-mapper.ts` and `packages/svelte-language/src/content-mapper.ts` are mapper process entry points.
- `packages/vue-language/src/language.ts` registers Vize and retains only authored Vue parsing/context.
- `packages/vue/src/rules/vForKeys.ts` correlates Vue ranges with native checker symbols through `SourceFile.spanMap`.

## Phase 1: Native Foundation

### Task 1: Pin the native nightly and prove the public API

**Files:**

- Modify: `pnpm-workspace.yaml`
- Modify: `packages/typescript-language/package.json`
- Create: `packages/typescript-language/src/nativeApi.test.ts`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Add a temporary native package alias**

Keep the existing TypeScript 6 catalog entry while migration commits still compile legacy files.
Add this exact catalog and package dependency:

```yaml
# pnpm-workspace.yaml
typescript-native: npm:typescript@7.1.0-dev.20260830.1
```

```json
// packages/typescript-language/package.json dependencies
"typescript-native": "catalog:dev"
```

- [ ] **Step 2: Install the lockfile update**

Run: `pnpm install`

Expected: pnpm installs the aliased 7.1 nightly without changing the existing TypeScript 6 resolution.

- [ ] **Step 3: Write a native API smoke test**

```ts
import { API } from "typescript-native/unstable/sync";
import { describe, expect, it } from "vitest";

describe("TypeScript native API", () => {
	it("creates and checks a program", () => {
		const api = new API({
			cwd: "/repo",
			fs: {
				readFile: (fileName) =>
					fileName === "/repo/index.ts" ? "const value: string = 1;" : null,
			},
		});
		const program = api.createProgram(["/repo/index.ts"], {
			compilerOptions: { noLib: true, strict: true },
		});

		try {
			expect(program.getSemanticDiagnostics()).toHaveLength(1);
		} finally {
			program.dispose();
			api.close();
		}
	});
});
```

- [ ] **Step 4: Run the smoke test**

Run: `pnpm test --project typescript-language src/nativeApi.test.ts`

Expected: PASS with one native semantic diagnostic.

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml packages/typescript-language/package.json packages/typescript-language/src/nativeApi.test.ts
git commit -m "test(typescript-language): prove TypeScript 7.1 native API"
```

### Task 2: Adapt Flint's host to the native filesystem

**Files:**

- Create: `packages/typescript-language/src/createTypeScriptFileSystem.ts`
- Create: `packages/typescript-language/src/createTypeScriptFileSystem.test.ts`
- Delete later: `packages/typescript-language/src/createTypeScriptServerHost.ts`

- [ ] **Step 1: Write filesystem contract tests**

Cover file contents, definite absence, directories, accessible entries, path normalization, and VFS shadowing:

```ts
import { describe, expect, it } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { createTypeScriptFileSystem } from "./createTypeScriptFileSystem.ts";

describe(createTypeScriptFileSystem, () => {
	it("reads Flint VFS files and directory entries", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/src/index.ts", "export {};");
		const fileSystem = createTypeScriptFileSystem(host);

		expect(fileSystem.readFile?.("/repo/src/index.ts")).toBe("export {};");
		expect(fileSystem.readFile?.("/repo/missing.ts")).toBeNull();
		expect(fileSystem.getAccessibleEntries?.("/repo/src")).toEqual({
			directories: [],
			files: ["index.ts"],
		});
	});
});
```

- [ ] **Step 2: Verify the test fails**

Run: `pnpm test --project typescript-language src/createTypeScriptFileSystem.test.ts`

Expected: FAIL because `createTypeScriptFileSystem.ts` does not exist.

- [ ] **Step 3: Implement the adapter**

```ts
import type { FileSystem } from "typescript-native/unstable/fs";

import type { LinterHost } from "@flint.fyi/core";

export function createTypeScriptFileSystem(host: LinterHost): FileSystem {
	return {
		directoryExists: (directoryName) =>
			host.fileTypeSync(directoryName) === "directory",
		fileExists: (fileName) => host.fileTypeSync(fileName) === "file",
		getAccessibleEntries(directoryName) {
			const entries = host.readDirectorySync(directoryName);
			return {
				directories: entries
					.filter(({ type }) => type === "directory")
					.map(({ name }) => name),
				files: entries
					.filter(({ type }) => type === "file")
					.map(({ name }) => name),
			};
		},
		readFile: (fileName) => host.readFileSync(fileName) ?? null,
	};
}
```

Use `null` only for definite absence and preserve `undefined` only if a future layered callback intentionally falls through to TypeScript's disk filesystem.
Omit `realpath` so the native host retains its disk-aware symlink handling.

- [ ] **Step 4: Run focused tests**

Run: `pnpm test --project typescript-language src/createTypeScriptFileSystem.test.ts && pnpm test --project core src/host/createVFSLinterHost.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/typescript-language/src/createTypeScriptFileSystem.ts packages/typescript-language/src/createTypeScriptFileSystem.test.ts
git commit -m "feat(typescript-language): adapt Flint host to native TypeScript"
```

### Task 3: Own native snapshots in a focused project session

**Files:**

- Create: `packages/typescript-language/src/createTypeScriptProjectSession.ts`
- Create: `packages/typescript-language/src/createTypeScriptProjectSession.test.ts`
- Modify: `packages/typescript-language/src/index.ts`

- [ ] **Step 1: Write lifecycle tests**

Test initial opens, changed/created/deleted file propagation, default-project lookup, snapshot replacement, and idempotent disposal.

```ts
using session = createTypeScriptProjectSession(host);
const first = session.update({ openFiles: ["/repo/src/index.ts"] });
expect(first.getDefaultProjectForFile("/repo/src/index.ts")).toBeDefined();

host.vfsUpsertFile("/repo/src/index.ts", "export const value = 2;");
const second = session.update({ changed: ["/repo/src/index.ts"] });
expect(second).not.toBe(first);
```

- [ ] **Step 2: Verify the lifecycle test fails**

Run: `pnpm test --project typescript-language src/createTypeScriptProjectSession.test.ts`

Expected: FAIL because the session does not exist.

- [ ] **Step 3: Implement the session contract**

```ts
export interface TypeScriptProjectSession extends Disposable {
	getSnapshot(): Snapshot;
	update(changes: {
		changed?: string[];
		created?: string[];
		deleted?: string[];
		openFiles?: string[];
		openProjects?: string[];
	}): Snapshot;
}
```

Construct `new API({ cwd: host.getCurrentDirectory(), fs: createTypeScriptFileSystem(host), runExternalCode: true })`.
Dispose the previous snapshot only after the replacement snapshot has been returned, and call `api.close()` from `[Symbol.dispose]`.

- [ ] **Step 4: Run lifecycle and leak tests**

Run: `pnpm test --project typescript-language src/createTypeScriptProjectSession.test.ts`

Expected: PASS, including assertions that stale project/checker use fails after snapshot disposal.

- [ ] **Step 5: Commit**

```bash
git add packages/typescript-language/src/createTypeScriptProjectSession.ts packages/typescript-language/src/createTypeScriptProjectSession.test.ts packages/typescript-language/src/index.ts
git commit -m "feat(typescript-language): manage native TypeScript snapshots"
```

### Task 4: Collect native diagnostics without legacy helpers

**Files:**

- Create: `packages/typescript-language/src/getTypeScriptDiagnostics.ts`
- Create: `packages/typescript-language/src/getTypeScriptDiagnostics.test.ts`
- Modify: `packages/typescript-language/src/convertTypeScriptDiagnosticToLanguageReport.ts`
- Modify: `packages/typescript-language/src/convertTypeScriptDiagnosticToLanguageReport.test.ts`

- [ ] **Step 1: Write diagnostic aggregation tests**

Assert syntax, bind, semantic, suggestion, declaration, global, program, and config diagnostics match the current `getPreEmitDiagnostics(program, sourceFile)` behavior and ordering.

- [ ] **Step 2: Verify the tests fail**

Run: `pnpm test --project typescript-language src/getTypeScriptDiagnostics.test.ts`

Expected: FAIL because the aggregator does not exist.

- [ ] **Step 3: Implement aggregation**

```ts
export function getTypeScriptDiagnostics(
	program: Program,
	fileName: string,
): readonly Diagnostic[] {
	return [
		...program.getConfigFileParsingDiagnostics(),
		...program.getProgramDiagnostics(),
		...program.getGlobalDiagnostics(),
		...program.getSyntacticDiagnostics(fileName),
		...program.getBindDiagnostics(fileName),
		...program.getSemanticDiagnostics(fileName),
		...program.getSuggestionDiagnostics(fileName),
		...program.getDeclarationDiagnostics(fileName),
	];
}
```

Update diagnostic conversion to native `Diagnostic` and native source-file/range fields.
Keep message flattening, categories, and Flint report ordering identical to current snapshots.

- [ ] **Step 4: Run diagnostic tests**

Run: `pnpm test --project typescript-language src/getTypeScriptDiagnostics.test.ts src/convertTypeScriptDiagnosticToLanguageReport.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/typescript-language/src/getTypeScriptDiagnostics.ts packages/typescript-language/src/getTypeScriptDiagnostics.test.ts packages/typescript-language/src/convertTypeScriptDiagnosticToLanguageReport.ts packages/typescript-language/src/convertTypeScriptDiagnosticToLanguageReport.test.ts
git commit -m "feat(typescript-language): collect native TypeScript diagnostics"
```

## Phase 2: Native AST and Rule Runtime

### Task 5: Generate TSL-style discriminated AST unions

**Files:**

- Create: `packages/typescript-language/scripts/generate-ast.ts`
- Replace: `packages/typescript-language/src/types/ast.ts`
- Create: `packages/typescript-language/src/types/ast.test-d.ts`
- Modify: `packages/typescript-language/package.json`
- Modify: `packages/typescript-language/tsconfig.test.json`

- [ ] **Step 1: Add compile-time narrowing assertions**

```ts
import { SyntaxKind } from "typescript-native/unstable/ast";
import { expectTypeOf } from "vitest";

import type { Declaration, Expression, Node, Statement } from "./ast.ts";

declare const node: Node;
if (node.kind === SyntaxKind.Identifier) {
	expectTypeOf(node.text).toBeString();
}

declare const declaration: Declaration;
declare const expression: Expression;
declare const statement: Statement;
expectTypeOf(declaration).toMatchTypeOf<Node>();
expectTypeOf(expression).toMatchTypeOf<Node>();
expectTypeOf(statement).toMatchTypeOf<Node>();
```

- [ ] **Step 2: Implement deterministic generation**

Parse the installed `typescript-native/dist/ast/*.d.ts` declarations.
Build an interface inheritance graph, collect every concrete node extending `NodeBase`, and emit native references.
Implement category collection independently so multiply inherited nodes appear in every applicable union.

The generated shape must follow this form:

```ts
import type * as NativeAST from "typescript-native/unstable/ast";

export type Node =
	| NativeAST.ArrayBindingPattern
	| NativeAST.ArrayLiteralExpression
	| NativeAST.SourceFile
	| NativeAST.YieldExpression;

export type Expression =
	| NativeAST.ArrayLiteralExpression
	| NativeAST.Identifier
	| NativeAST.YieldExpression;
```

Include aliases for `Expression`, `Statement`, `TypeNode`, `Declaration`, `UnaryExpression`, and every named category imported elsewhere in `packages/**/src`.
Include all members from the installed declarations rather than only the illustrative members above.

- [ ] **Step 3: Add a generation check script**

```json
"generate:ast": "node scripts/generate-ast.ts",
"test:ast": "pnpm generate:ast && git diff --exit-code -- src/types/ast.ts"
```

- [ ] **Step 4: Generate and type-check**

Run: `pnpm --filter @flint.fyi/typescript-language generate:ast && pnpm exec tsc -b packages/typescript-language/tsconfig.json`

Expected: generated output is exhaustive, deterministic, and all narrowing assertions compile.

- [ ] **Step 5: Commit**

```bash
git add packages/typescript-language/scripts/generate-ast.ts packages/typescript-language/src/types/ast.ts packages/typescript-language/src/types/ast.test-d.ts packages/typescript-language/package.json packages/typescript-language/tsconfig.test.json
git commit -m "feat(typescript-language): generate discriminated native AST unions"
```

### Task 6: Replace visitor and checker contracts

**Files:**

- Modify: `packages/typescript-language/src/nodes.ts`
- Replace: `packages/typescript-language/src/types/checker.ts`
- Modify: `packages/typescript-language/src/index.ts`
- Modify: `packages/typescript-language/src/language.ts`
- Create: `packages/typescript-language/src/language.test.ts`

- [ ] **Step 1: Write visitor traversal tests**

Use a native program containing nested declarations and assert enter/exit ordering and concrete node narrowing.

```ts
expect(events).toEqual([
	"SourceFile",
	"VariableStatement",
	"VariableDeclarationList",
	"VariableDeclaration",
	"Identifier",
	"Identifier:exit",
	"VariableDeclaration:exit",
	"VariableDeclarationList:exit",
	"VariableStatement:exit",
	"SourceFile:exit",
]);
```

- [ ] **Step 2: Derive visitor types from native unions**

Replace the handwritten legacy mapping with a generated mapping keyed by native `SyntaxKind` names.
Keep Flint's `WithExitKeys<TypeScriptNodesByName>` dispatch contract.

- [ ] **Step 3: Replace file services**

```ts
export interface TypeScriptFileServices {
	checker: Checker;
	program: Program;
	project: Project;
	snapshot: Snapshot;
	sourceFile: AST.SourceFile;
	spanMap?: SpanMap;
}
```

Import `SpanMap` from `typescript-native/unstable/ast`.
Delete `CheckerOverrides` and expose the native `Checker` type directly.
Rename all `typeChecker` service accesses to `checker` in later migration tasks.

- [ ] **Step 4: Implement native child traversal**

Use `forEachChild` from `typescript-native/unstable/ast/visitor` or the public node child API.
Resolve visitor keys through native `SyntaxKind[node.kind]` and invoke enter, children, then exit.

- [ ] **Step 5: Run focused tests and commit**

Run: `pnpm test --project typescript-language src/language.test.ts`

Expected: PASS with exact enter/exit ordering.

```bash
git add packages/typescript-language/src/nodes.ts packages/typescript-language/src/types/checker.ts packages/typescript-language/src/index.ts packages/typescript-language/src/language.ts packages/typescript-language/src/language.test.ts
git commit -m "feat(typescript-language): expose native AST rule services"
```

### Task 7: Port TypeScript-language scope and utilities

**Files:**

- Modify: `packages/typescript-language/src/scope/*.ts`
- Modify: `packages/typescript-language/src/utils/*.ts`
- Modify: `packages/typescript-language/src/directives/parseDirectivesFromTypeScriptFile.ts`
- Modify: `packages/typescript-language/src/collectReferencedFilePaths.ts`
- Modify: `packages/typescript-language/src/getTSNodeRange.ts`
- Modify: `packages/typescript-language/src/normalizeRange.ts`
- Modify: corresponding tests under `packages/typescript-language/src/**/*.test.ts`

- [ ] **Step 1: Switch syntax imports to the native AST**

Use this import shape throughout this package:

```ts
import { NodeFlags, SyntaxKind } from "typescript-native/unstable/ast";

import * as AST from "./types/ast.ts";
```

Use native checker/program imports only from `typescript-native/unstable/sync`.

- [ ] **Step 2: Replace the three `ts-api-utils` consumers**

Replace `forEachToken`, declaration checks, and control-flow checks with native AST utilities or local traversal.
The affected files are:

```text
packages/typescript-language/src/collectReferencedFilePaths.ts
packages/typescript-language/src/directives/parseDirectivesFromTypeScriptFile.ts
packages/typescript-language/src/scope/identifierReferences.ts
```

- [ ] **Step 3: Update range and source-file APIs**

Use native `pos`, `end`, source text, and line-map APIs.
Do not retain legacy `getStart(sourceFile)` assumptions where native nodes provide direct ranges.

- [ ] **Step 4: Run the complete package suite**

Run: `pnpm test --project typescript-language && pnpm exec tsc -b packages/typescript-language/tsconfig.json`

Expected: PASS with no import from `ts-api-utils`, `@typescript-eslint/project-service`, or legacy `typescript` inside `packages/typescript-language/src`.

- [ ] **Step 5: Commit**

```bash
git add packages/typescript-language/src
git commit -m "refactor(typescript-language): port scope and utilities to native AST"
```

### Task 8: Activate the native language runtime

**Files:**

- Modify: `packages/typescript-language/src/language.ts`
- Delete: `packages/typescript-language/src/createTypeScriptServerHost.ts`
- Modify: `packages/typescript-language/src/orderTypeScriptFilePaths.ts`
- Modify: `packages/typescript-language/src/getTypeScriptFileCacheImpacts.ts`
- Modify: `packages/core/src/running/collectLanguageFilesByFilePath.test.ts`
- Modify: `packages/e2e/tests/typescript/typescript.test.ts`

- [ ] **Step 1: Add failing file lifecycle tests**

Assert one session is reused across ordered files, each file resolves through its active snapshot, updates replace the snapshot, and finalization disposes the session.

- [ ] **Step 2: Replace ProjectService creation**

In `createFileFactory`, create one `TypeScriptProjectSession`.
Open ordered file paths through `updateSnapshot({ openFiles })`, resolve `snapshot.getDefaultProjectForFile(filePath)`, then retrieve `project.program.getSourceFile(filePath)` and `project.checker`.

- [ ] **Step 3: Replace diagnostics and traversal**

Call `getTypeScriptDiagnostics(program, sourceFile.fileName)` and the native visitor dispatcher from Task 6.
Preserve directive parsing, report order, cache impacts, and file disposal behavior.

- [ ] **Step 4: Verify the native runtime**

Run: `pnpm test --project typescript-language && pnpm test --project e2e tests/typescript/typescript.test.ts`

Expected: existing TypeScript E2E output remains unchanged.

- [ ] **Step 5: Commit**

```bash
git add packages/typescript-language packages/core/src/running/collectLanguageFilesByFilePath.test.ts packages/e2e/tests/typescript/typescript.test.ts
git commit -m "feat(typescript-language): run linting on native TypeScript"
```

## Phase 3: Rule Migration

### Task 9: Port syntax-only rules and downstream AST consumers

**Files:**

- Modify: `packages/ts/src/rules/**/*.ts`
- Modify: `packages/jsx/src/**/*.ts`
- Modify: `packages/browser/src/**/*.ts`
- Modify: `packages/node/src/**/*.ts`
- Modify: `packages/vitest/src/**/*.ts`
- Modify: `packages/plugin-flint/src/**/*.ts`
- Modify: other `packages/*/src/**/*.ts` files importing `typescript`

- [ ] **Step 1: Mechanically split legacy imports**

Replace AST values and types with `typescript-native/unstable/ast` plus `@flint.fyi/typescript-language`'s `AST` namespace.
Replace checker/program types with `typescript-native/unstable/sync`.

```ts
// Before
import ts, { SyntaxKind, type Node } from "typescript";
// After
import { SyntaxKind } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";
```

- [ ] **Step 2: Port syntax-only TS rules in alphabetical batches**

Use batches `accessor*` through `constructor*`, `date*` through `namespace*`, `native*` through `return*`, and `self*` through `wrapperObjects`.
After each batch run:

Run: `pnpm test --project ts`

Expected: existing snapshots pass without message or fix changes.

- [ ] **Step 3: Port downstream package groups**

Run after each package group:

```bash
pnpm test --project jsx
pnpm test --project browser
pnpm test --project node
pnpm test --project vitest
pnpm test --project plugin-flint
```

Expected: PASS.

- [ ] **Step 4: Verify no legacy AST imports remain in migrated sources**

Run:

```bash
grep -RIn --include='*.ts' --exclude-dir=lib --exclude-dir=node_modules 'from "typescript"' packages/*/src
```

Expected: output contains only files explicitly assigned to Task 10's type-aware migration.

- [ ] **Step 5: Commit**

```bash
git add packages/*/src
git commit -m "refactor: port syntax rules to native TypeScript AST"
```

### Task 10: Port type-aware utilities and rules

**Files:**

- Modify: `packages/ts/src/rules/utils/*.ts`
- Modify: `packages/ts/src/type-utils/*.ts`
- Modify: the 40 `packages/ts/src` files importing `ts-api-utils`
- Modify: `packages/performance/src/rules/{loopAwaits,loopFunctions,spreadAccumulators}.ts`
- Modify: all remaining rules that access `services.typeChecker`

- [ ] **Step 1: Rename checker service access**

```ts
// Before
const type = services.typeChecker.getTypeAtLocation(node);

// After
const type = services.checker.getTypeAtLocation(node);
```

- [ ] **Step 2: Port shared type utilities first**

Port `discriminateAnyType`, `formatReportedType`, `getConstrainedType`, `isBuiltinSymbolLike`, `isTypeRecursive`, and `isUnsafeAssignment` to native `Checker`, `Type`, `Symbol`, and `Signature` methods.
Use native batch overloads when a rule queries multiple nodes or symbols together.

- [ ] **Step 3: Remove all 43 rule-level `ts-api-utils` imports**

Port the exact inventory returned by:

```bash
find packages/ts packages/performance -type f -path '*/src/*' -name '*.ts' -print0 | xargs -0 grep -Il 'ts-api-utils' | sort
```

Use native guards and flags when present.
Keep one-use structural checks in their rule files.

- [ ] **Step 4: Run type-aware suites after each utility cluster**

Run: `pnpm test --project ts && pnpm test --project performance`

Expected: all existing messages, fixes, and report ranges pass.

- [ ] **Step 5: Verify dependency removal readiness**

Run:

```bash
grep -RIn --include='*.ts' --exclude-dir=lib --exclude-dir=node_modules 'ts-api-utils\|typeChecker' packages/*/src
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add packages/ts/src packages/performance/src
git commit -m "refactor: port type-aware rules to native checker"
```

## Phase 4: Content Mappers

### Task 11: Register mappers and create virtual overlay configs

**Files:**

- Create: `packages/typescript-language/src/contentMappers.ts`
- Create: `packages/typescript-language/src/contentMappers.test.ts`
- Create: `packages/typescript-language/src/createTypeScriptOverlayConfig.ts`
- Create: `packages/typescript-language/src/createTypeScriptOverlayConfig.test.ts`
- Modify: `packages/typescript-language/src/createTypeScriptProjectSession.ts`
- Modify: `packages/typescript-language/src/index.ts`

- [ ] **Step 1: Define mapper registration**

```ts
export interface TypeScriptContentMapperRegistration {
	extensions: string[];
	options?: Record<string, unknown>;
	packageName: string;
}

export function registerTypeScriptContentMapper(
	registration: TypeScriptContentMapperRegistration,
): () => boolean;
```

Store registrations in the same package-version-guarded global pattern currently used for Volar initializers.

- [ ] **Step 2: Write overlay tests**

Assert an overlay extends the absolute user config, copies project references, adds only registered mappers, and does not modify the authored config.

```json
{
	"extends": "/repo/tsconfig.json",
	"references": [{ "path": "/repo/packages/core" }],
	"contentMappers": [{ "package": "vize", "extensions": [".vue"] }]
}
```

- [ ] **Step 3: Implement virtual overlay files**

Generate stable paths under the host-only namespace `/repo/node_modules/.cache/flint/typescript-overlays/`.
Serve their JSON through `createTypeScriptFileSystem.readFile`, include them in `fileExists`, and open them through `updateSnapshot({ openProjects })`.

- [ ] **Step 4: Resolve authored files from overlay projects**

For files assigned to an overlay, retrieve `snapshot.getProject(overlayPath)` and then `project.program.getSourceFile(authoredPath)`.
Use default-project lookup only for projects without registered mapped extensions.

- [ ] **Step 5: Run project-reference and VFS tests**

Run: `pnpm test --project typescript-language src/contentMappers.test.ts src/createTypeScriptOverlayConfig.test.ts src/createTypeScriptProjectSession.test.ts`

Expected: PASS for referenced configs, inherited includes, relative paths, and VFS-only projects.

- [ ] **Step 6: Commit**

```bash
git add packages/typescript-language/src
git commit -m "feat(typescript-language): configure content mappers in virtual projects"
```

### Task 12: Build the shared Volar content-mapper process support

**Files:**

- Create: `packages/volar-language/src/content-mapper/protocol.ts`
- Create: `packages/volar-language/src/content-mapper/runContentMapper.ts`
- Create: `packages/volar-language/src/content-mapper/createVolarTransform.ts`
- Create: `packages/volar-language/src/content-mapper/runContentMapper.test.ts`
- Modify: `packages/volar-language/src/index.ts`

- [ ] **Step 1: Write framed JSON-RPC tests**

Feed `initialize`, `openProject`, `transform`, and `closeProject` messages through in-memory streams.
Assert `Content-Length` framing, UTF-8 negotiation, project-handle isolation, option diagnostics, and cleanup.

- [ ] **Step 2: Implement protocol types from upstream PR #4712**

Represent `SpanMapping` as:

```ts
export type SpanMapping = [
	virtualStart: number,
	virtualLength: number,
	originalStart: number,
	originalLength: number,
	kind: 0 | 1 | 2,
	features?: number,
];
```

Implement only server-side methods TypeScript sends.
Reject malformed requests with JSON-RPC errors and return mapper diagnostics for transform failures.

- [ ] **Step 3: Convert Volar mappings**

Flatten each service script's source mappings into non-overlapping protocol tuples.
Use verbatim kind `0` only when source and generated text and length match.
Use atom kind `1` for mapped text with different spelling or length.
Exclude unmapped scaffolding.

- [ ] **Step 4: Run protocol tests**

Run: `pnpm test --project volar-language`

Expected: PASS with multiple concurrent project handles and non-ASCII UTF-8 input.

- [ ] **Step 5: Commit**

```bash
git add packages/volar-language/src
git commit -m "feat(volar-language): serve TypeScript content mappings"
```

### Task 13: Convert Svelte to a content mapper

**Files:**

- Create: `packages/svelte-language/src/content-mapper.ts`
- Create: `packages/svelte-language/src/content-mapper.test.ts`
- Modify: `packages/svelte-language/src/volarLanguagePlugin.ts`
- Modify: `packages/svelte-language/src/language.ts`
- Modify: `packages/svelte-language/src/index.ts`
- Modify: `packages/svelte-language/package.json`
- Modify: `packages/svelte-language/tsdown.config.ts`

- [ ] **Step 1: Extract a pure Svelte transform**

Refactor the current `svelte2tsx` and decoded-source-map path to accept source text plus project options and return transformed TSX, mappings, compiler diagnostics, and directives without a TypeScript `createProgram` hook.

- [ ] **Step 2: Add the mapper manifest**

```json
"typescript": {
	"contentMapper": {
		"exec": ["node", "./dist/content-mapper.mjs"],
		"dynamicConfig": true,
		"compilerOptions": ["jsx", "module", "moduleResolution"]
	}
}
```

Return Svelte config paths as `watchedFiles` and a stable configuration hash as `configIdentity`.

- [ ] **Step 3: Register `.svelte` from the language package**

```ts
registerTypeScriptContentMapper({
	extensions: [".svelte"],
	packageName: "@flint.fyi/svelte-language",
});
```

Keep the authored Svelte AST/source context in `language.ts` and replace Volar report mapping with native `spanMap`.

- [ ] **Step 4: Verify parity**

Run: `pnpm test --project svelte-language && pnpm test --project svelte && pnpm test --project e2e tests/svelte`

Expected: existing compiler errors, directives, rule reports, and source ranges pass.

- [ ] **Step 5: Commit**

```bash
git add packages/svelte-language packages/svelte packages/e2e/tests/svelte
git commit -m "feat(svelte-language): use TypeScript content mapper"
```

### Task 14: Convert Astro to a content mapper

**Files:**

- Create: `packages/astro-language/src/content-mapper.ts`
- Create: `packages/astro-language/src/content-mapper.test.ts`
- Modify: `packages/astro-language/src/language.ts`
- Modify: `packages/astro-language/src/index.ts`
- Modify: `packages/astro-language/package.json`
- Modify: `packages/astro-language/tsdown.config.ts`

- [ ] **Step 1: Extract Astro's Volar transform**

Use `@astrojs/compiler` and Astro's language plugin to produce canonical TSX plus supplemental script outputs.
Convert compiler diagnostics and every source mapping to protocol output.

- [ ] **Step 2: Add the mapper manifest and registration**

Declare `./dist/content-mapper.mjs` as the process entry and register `.astro` with `@flint.fyi/typescript-language`.
Declare framework configuration files as dynamic watched files when they affect transformation.

- [ ] **Step 3: Traverse supplemental outputs**

Update `typescript-language` to load every `sourceFile.supplementalSourceFileNames` entry through `program.getSourceFile(name)`.
Run visitors on mapped canonical and supplemental files while de-duplicating authored report ranges.

- [ ] **Step 4: Verify parity**

Run: `pnpm test --project astro-language && pnpm test --project astro && pnpm test --project e2e tests/astro`

Expected: Astro compiler diagnostics, directives, script rules, and template source ranges pass.

- [ ] **Step 5: Commit**

```bash
git add packages/astro-language packages/astro packages/typescript-language packages/e2e/tests/astro
git commit -m "feat(astro-language): use TypeScript content mapper"
```

### Task 15: Adopt Vize for Vue and remove same-codegen assumptions

**Files:**

- Modify: `packages/vue-language/package.json`
- Modify: `packages/vue-language/src/language.ts`
- Modify: `packages/vue-language/src/index.ts`
- Modify: `packages/vue/src/rules/vForKeys.ts`
- Modify: `packages/vue/src/rules/vForKeys.test.ts`
- Create: `packages/vue-language/src/vizeContentMapper.test.ts`

- [ ] **Step 1: Add Vize and register its mapper**

Add `vize` as a direct dependency of `@flint.fyi/vue-language`.

```ts
registerTypeScriptContentMapper({
	extensions: [".vue"],
	packageName: "vize",
});
```

Remove Vue `codegen`, Volar `map`, and `virtualCode` services after confirming no rule other than `vForKeys` consumes them.
Retain the compiler-dom `sfc` AST and authored directives.

- [ ] **Step 2: Add Vize conformance fixtures**

Cover explicit keys, shorthand keys, destructuring/default aliases, nested loops, lambda shadowing, duplicate projections, atom mappings, malformed templates, and non-ASCII source.
Run Vize through TypeScript's mapper host, not by importing Vize internals.

- [ ] **Step 3: Rewrite `vForKeys` correlation**

For each authored key-expression range, call `spanMap.originalToVirtualSpans(range, SpanMapFeature.References)`.
Resolve identifiers in every mapped projection with `checker.getSymbolAtLocation`.
Resolve each declaration handle, map its name span back with `virtualToOriginalSpan`, and accept it only when the authored declaration falls inside the compiler-dom ranges for the `v-for` value, key, or index alias.

- [ ] **Step 4: Verify Vue parity**

Run: `pnpm test --project vue-language && pnpm test --project vue && pnpm test --project e2e tests/vue`

Expected: all current tests and the new shadowing/mapping matrix pass.

If the failures show Vize omits a required key or alias mapping, replace the direct Vize registration with an owned Vue mapper using the Task 12 server and the existing Vue language-core transform.
Do not access Vize private APIs or compare Vize coordinates with Volar coordinates.

- [ ] **Step 5: Commit**

```bash
git add packages/vue-language packages/vue packages/e2e/tests/vue pnpm-lock.yaml
git commit -m "feat(vue-language): lint Vue through Vize content mapper"
```

## Phase 5: Cleanup and Whole-Repository Verification

### Task 16: Remove legacy compiler integration and dependencies

**Files:**

- Delete: `packages/ts-patch/`
- Delete: legacy interception code from `packages/volar-language/src/language.ts`
- Modify: `packages/volar-language/src/index.ts`
- Modify: `vitest.config.ts`
- Modify: `tsconfig.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Modify: every `packages/*/package.json` containing a TypeScript 5/6 range

- [ ] **Step 1: Remove test-time patch hooks**

Delete `@flint.fyi/ts-patch/install-patch-hooks` from Vitest setup and remove the root dev dependency and tsconfig project reference.

- [ ] **Step 2: Delete interception APIs**

Delete `setTSProgramCreationProxy`, `setTSExtraSupportedExtensions`, transformed `tsc` loading, and Volar `proxyCreateProgram` usage.
Keep only Volar code-generation helpers still used by Astro or Svelte mapper transforms.

- [ ] **Step 3: Switch from the temporary alias to TypeScript 7.1**

Replace the catalog's TypeScript 6 entry with the exact version currently resolved by the temporary `typescript-native` alias.
Replace `typescript-native/unstable/*` imports with `typescript/unstable/*` and remove the temporary alias.
Change package TypeScript dependencies to `catalog:dev` so every workspace package uses that one native API and binary.

- [ ] **Step 4: Remove legacy dependencies**

Remove `@typescript-eslint/project-service` and `ts-api-utils` from all manifests.
Run `pnpm install` to update the lockfile.

- [ ] **Step 5: Prove cleanup is complete**

Run:

```bash
grep -RIn --exclude-dir=node_modules --exclude-dir=lib --exclude=pnpm-lock.yaml 'ts-patch\|ts-api-utils\|@typescript-eslint/project-service\|typescript-native\|proxyCreateProgram\|setTSProgramCreationProxy' .
```

Expected: no source, config, or manifest matches.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove legacy TypeScript compiler integration"
```

### Task 17: Add cross-platform packed-package integration coverage

**Files:**

- Create: `packages/e2e/tests/typescript-native/`
- Modify: `.github/workflows/ci.yaml`
- Modify: `packages/e2e/tests/utils.ts`

- [ ] **Step 1: Add packed fixtures**

Create fixtures for configured TypeScript, inferred JavaScript/JSDoc, project references, a changed file between runs, Astro supplemental scripts, Svelte config invalidation, and Vue/Vize mappings.
Each fixture must invoke packed Flint packages rather than workspace source imports.

- [ ] **Step 2: Add lifecycle failure fixtures**

Assert actionable output for native process startup failure, invalid tsconfig, mapper option errors, malformed mapper responses, and mapper process exit.

- [ ] **Step 3: Run on all native platforms**

Add a CI matrix for `ubuntu-latest`, `macos-latest`, and `windows-latest` that installs, builds, packs, and runs the `typescript-native` E2E project.

- [ ] **Step 4: Verify locally**

Run: `pnpm build && pnpm test --project e2e tests/typescript-native`

Expected: PASS with no platform-dependent snapshot text.

- [ ] **Step 5: Commit**

```bash
git add packages/e2e .github/workflows/ci.yaml
git commit -m "test: cover native TypeScript integration across platforms"
```

### Task 18: Benchmark and run the final verification matrix

**Files:**

- Modify: `packages/performance-testing/src/generate.ts`
- Modify: `packages/performance-testing/src/measure.ts`
- Modify: `packages/performance-testing/README.md`

- [ ] **Step 1: Add native timing scenarios**

Measure cold project startup, warm unchanged lint, one changed file, type-aware rules, Astro, Svelte, and Vue.
Record separate labels for project creation, AST transfer, checker queries, mapper transformation, and Flint rule execution when native timing data is available.

- [ ] **Step 2: Capture TypeScript 6 and 7.1 comparison data**

Run commit `aa2d1823` for the TypeScript 6 baseline, then the migration branch for TypeScript 7.1 with identical fixture copies and hyperfine settings.

Run:

```bash
pnpm build
pnpm --filter-prod flint... pack
pnpm --filter=performance-testing generate
pnpm --filter=performance-testing measure
```

Expected: complete measurements for cold, warm, changed-file, and three embedded-language scenarios.

- [ ] **Step 3: Investigate process-boundary regressions**

If any native scenario regresses, use collected timings to identify repeated filesystem callbacks or scalar checker calls.
Batch checker requests with native array overloads and cache immutable filesystem entries for the active snapshot, then rerun the affected scenario.

- [ ] **Step 4: Run repository verification**

```bash
pnpm dedupe --check --prefer-offline
pnpm exec tsc -b
pnpm build
pnpm test --project='!e2e'
pnpm test --project=e2e
pnpm --filter=site check
pnpm lint
pnpm lint:knip:prod
```

Expected: every command exits successfully.

- [ ] **Step 5: Verify generated AST stability**

Run: `pnpm --filter @flint.fyi/typescript-language test:ast`

Expected: no diff in `src/types/ast.ts`.

- [ ] **Step 6: Commit benchmark support and any verified fixes**

```bash
git add packages/performance-testing packages/typescript-language/src/types/ast.ts
git commit -m "perf: measure native TypeScript linting"
```

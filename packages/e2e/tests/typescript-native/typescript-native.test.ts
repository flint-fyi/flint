import {
	cp,
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { execa } from "execa";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { normalizeOutput, runFlint, type RunFlintResult } from "../utils.ts";

const sourceDirectory = import.meta.dirname;
let fixtureDirectory: string;

// These tests install Flint from tarballs, so they only run in the CI job that
// packs the workspace first. Every other `--project e2e` run skips them rather
// than failing on the missing directory.
const packDirectory = process.env.FLINT_E2E_PACK_DIR;

describe.skipIf(!packDirectory)("packed TypeScript native integration", () => {
	beforeAll(async () => {
		// `skipIf` above already guarantees this; assert so the suite fails loudly
		// rather than silently doing nothing if it ever runs without the packs.
		if (!packDirectory) {
			throw new Error("FLINT_E2E_PACK_DIR must point to packed Flint packages");
		}
		// Flint prints real paths, so the temporary directory's symlinked spelling
		// (macOS's `/var` for `/private/var`) would not match `<cwd>`.
		fixtureDirectory = await realpath(
			await mkdtemp(path.join(tmpdir(), "flint-typescript-native-")),
		);
		await cp(sourceDirectory, fixtureDirectory, {
			filter: (source) => !source.endsWith(".test.ts"),
			recursive: true,
		});

		const tarballs = (await readdir(packDirectory))
			.filter((fileName) => fileName.endsWith(".tgz"))
			.map((fileName) => path.join(packDirectory, fileName));
		const packedPackages = Object.fromEntries(
			tarballs.map((tarball) => {
				const fileName = path.basename(tarball);
				const packageName = fileName.startsWith("flint.fyi-")
					? `@flint.fyi/${fileName.slice("flint.fyi-".length).replace(/-\d[^/]*\.tgz$/, "")}`
					: "flint";
				return [packageName, pathToFileURL(tarball).href];
			}),
		);
		// Flint never runs Astro, so esbuild's install script (which only fetches
		// its native binary) can be declined rather than making pnpm ask.
		await writeFile(
			path.join(fixtureDirectory, "pnpm-workspace.yaml"),
			[
				"allowBuilds:",
				"  esbuild: false",
				"overrides:",
				...Object.entries(packedPackages).map(
					([packageName, tarballUrl]) =>
						`  ${JSON.stringify(packageName)}: ${JSON.stringify(tarballUrl)}`,
				),
				"",
			].join("\n"),
		);
		await writeFile(
			path.join(fixtureDirectory, "package.json"),
			JSON.stringify({
				dependencies: {
					"@flint.fyi/astro": packedPackages["@flint.fyi/astro"],
					"@flint.fyi/svelte": packedPackages["@flint.fyi/svelte"],
					"@flint.fyi/ts": packedPackages["@flint.fyi/ts"],
					"@flint.fyi/vue": packedPackages["@flint.fyi/vue"],
					astro: "7.3.5",
					flint: packedPackages.flint,
					"prettier-plugin-astro": "0.14.1",
					"prettier-plugin-svelte": "^3.4.0",
					svelte: "5.56.10",
					typescript: "npm:@typescript/typescript6@6.0.2",
					"typescript-native": "npm:typescript@7.1.0-dev.20260830.1",
				},
				private: true,
				type: "module",
			}),
		);
		await execa("pnpm", ["install"], {
			cwd: fixtureDirectory,
		});
	}, 120_000);

	afterAll(async () => {
		await rm(fixtureDirectory, { force: true, recursive: true });
	});

	it("reports rule and language reports in authored coordinates when linting configured, inferred, referenced, Astro, Svelte, and Vue sources", async () => {
		const { exitCode, stderr, stdout } = await runFlint(fixtureDirectory);

		expect(exitCode).toBe(1);
		expect(normalizeOutput(`${stdout}\n${stderr}`, fixtureDirectory))
			.toMatchInlineSnapshot(`
				"<dim>Linting with <cyan><bold>flint.config.ts</bold><dim>...</fg>

				<underline><cwd>/fixtures/component.astro</underline>
				<dim>  4:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>
				<dim>  8:5</fg>  Void expressions should not be used as values.              <yellow>ts/misleadingVoidExpressions</fg>

				<underline><cwd>/fixtures/component.svelte</underline>
				<dim>  4:3</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<underline><cwd>/fixtures/component.vue</underline>
				<dim>  4:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<underline><cwd>/fixtures/configured.ts</underline>
				<dim>  2:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<underline><cwd>/fixtures/inferred.js</underline>
				<dim>  3:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<underline><cwd>/fixtures/reference/referenced.ts</underline>
				<dim>  2:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<red>✖ Found <bold>7 reports</bold> across <bold>6 files</bold>.
				</fg>
				<dim>Finished in <time> on 7 files with 140 rules.
				</fg>
				<yellow>⚠️  Additionally found 3 language reportss:</fg>

				[96mfixtures/component.astro</>:[93m2</>:[93m7</> - <dim>TS2322</>: Type 'string' is not assignable to type 'number'.
				[7m2</> const typed: number = "text";
				[7m </> [91m      ~~~~~</>
				[96mfixtures/component.svelte</>:[93m2</>:[93m8</> - <dim>TS2322</>: Type 'string' is not assignable to type 'number'.
				[7m2</>  const typed: number = "text";
				[7m </> [91m       ~~~~~</>
				[96mfixtures/component.vue</>:[93m2</>:[93m7</> - <dim>TS2322</>: Type 'string' is not assignable to type 'number'.
				[7m2</> const typed: number = "text";
				[7m </> [91m      ~~~~~</>

				"
			`);
	}, 60_000);

	it("observes a changed file between runs", async () => {
		const fileName = path.join(fixtureDirectory, "fixtures/changed.ts");
		const original = await readFile(fileName, "utf8");
		const initial = await runFlint(fixtureDirectory);
		expect(`${initial.stdout}\n${initial.stderr}`).not.toContain("changed.ts");
		try {
			await writeFile(fileName, `${original}\ndebugger;\n`);

			const result = await runFlint(fixtureDirectory);
			expect(result.exitCode).toBe(1);
			expect(`${result.stdout}\n${result.stderr}`).toContain("changed.ts");
			expect(`${result.stdout}\n${result.stderr}`).toContain(
				"ts/debuggerStatements",
			);
		} finally {
			await writeFile(fileName, original);
		}
	}, 60_000);

	it("reloads a changed Svelte config between runs", async () => {
		const configFileName = path.join(fixtureDirectory, "svelte.config.js");
		const original = await readFile(configFileName, "utf8");
		const initial = await runFlint(fixtureDirectory);
		expect(`${initial.stdout}\n${initial.stderr}`).toContain(
			"component.svelte",
		);
		try {
			await writeFile(
				configFileName,
				"export default { compilerOptions: { runes: true } };\n",
			);

			const { exitCode, stderr, stdout } = await runFlint(fixtureDirectory);
			expect(exitCode).toBe(1);
			expect(`${stdout}\n${stderr}`).toContain("component.svelte");
			expect(`${stdout}\n${stderr}`).toContain("ts/debuggerStatements");
		} finally {
			await writeFile(configFileName, original);
		}
	}, 60_000);

	it("reports an invalid tsconfig without platform-dependent output", async () => {
		const configFileName = path.join(fixtureDirectory, "tsconfig.json");
		const flintConfigFileName = path.join(fixtureDirectory, "flint.config.ts");
		const originalConfig = await readFile(configFileName, "utf8");
		const originalFlintConfig = await readFile(flintConfigFileName, "utf8");
		let result: RunFlintResult;
		try {
			await writeFile(
				flintConfigFileName,
				'import { ts } from "@flint.fyi/ts";\nimport { defineConfig } from "flint";\nexport default defineConfig({ use: [{ files: "fixtures/**/*.ts", rules: ts.presets.logical }] });\n',
			);
			await writeFile(
				configFileName,
				'{ "compilerOptions": { "target": 42 } }',
			);
			result = await runFlint(fixtureDirectory);
		} finally {
			await writeFile(configFileName, originalConfig);
			await writeFile(flintConfigFileName, originalFlintConfig);
		}

		expect(result.exitCode).not.toBe(0);
		expect(`${result.stdout}\n${result.stderr}`).toMatch(/target|tsconfig/i);
	}, 60_000);
});

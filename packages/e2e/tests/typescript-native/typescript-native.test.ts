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

// Formatting would need Prettier plugins for Astro and Svelte, and these tests
// are only about linting.
function runFixtureFlint(): Promise<RunFlintResult> {
	return runFlint(fixtureDirectory, ["--skip-formatting"]);
}

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
					svelte: "5.56.10",
					typescript: "npm:@typescript/typescript6@6.0.2",
					"typescript-native": "npm:typescript@7.1.0-beta",
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
		const { exitCode, stderr, stdout } = await runFixtureFlint();

		expect(exitCode).toBe(1);
		expect(normalizeOutput(`${stdout}\n${stderr}`, fixtureDirectory))
			.toMatchInlineSnapshot(`
				"<grey>Linting with <cyan><bold>flint.config.ts</bold><grey>...</fg>

				<underline><cwd>/fixtures/component.astro</underline>
				<grey>  4:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>
				<grey>  8:5</fg>  Void expressions should not be used as values.              <yellow>ts/misleadingVoidExpressions</fg>

				<underline><cwd>/fixtures/component.svelte</underline>
				<grey>  4:3</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<underline><cwd>/fixtures/component.vue</underline>
				<grey>  4:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<underline><cwd>/fixtures/configured.ts</underline>
				<grey>  2:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<underline><cwd>/fixtures/inferred.js</underline>
				<grey>  3:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<underline><cwd>/fixtures/reference/referenced.ts</underline>
				<grey>  2:2</fg>  Debugger statements should not be used in production code.  <yellow>ts/debuggerStatements</fg>

				<red>✖ Found <bold>7 reports</bold> across <bold>6 files</bold>.
				</fg>
				<grey>Finished in <time> on 7 files with 140 rules.
				</fg>
				<yellow>⚠️  Additionally found 3 language reportss:</fg>

				<cyanBright>fixtures/component.astro</>:<yellowBright>2</>:<yellowBright>7</> - <grey>TS2322</>: Type 'string' is not assignable to type 'number'.
				<inverse>2</> const typed: number = "text";
				<inverse> </> <redBright>      ~~~~~</>
				<cyanBright>fixtures/component.svelte</>:<yellowBright>2</>:<yellowBright>8</> - <grey>TS2322</>: Type 'string' is not assignable to type 'number'.
				<inverse>2</>  const typed: number = "text";
				<inverse> </> <redBright>       ~~~~~</>
				<cyanBright>fixtures/component.vue</>:<yellowBright>2</>:<yellowBright>7</> - <grey>TS2322</>: Type 'string' is not assignable to type 'number'.
				<inverse>2</> const typed: number = "text";
				<inverse> </> <redBright>      ~~~~~</>

				"
			`);
	}, 60_000);

	it("observes a changed file between runs", async () => {
		const fileName = path.join(fixtureDirectory, "fixtures/changed.ts");
		const original = await readFile(fileName, "utf8");
		const initial = await runFixtureFlint();
		expect(`${initial.stdout}\n${initial.stderr}`).not.toContain("changed.ts");
		try {
			await writeFile(fileName, `${original}\ndebugger;\n`);

			const result = await runFixtureFlint();
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
		const failedTransform =
			"The content mapper '@flint.fyi/svelte' failed to transform this file.";
		const initial = await runFixtureFlint();
		expect(`${initial.stdout}\n${initial.stderr}`).not.toContain(
			failedTransform,
		);
		try {
			await writeFile(
				configFileName,
				'throw new Error("Invalid Svelte config.");\n',
			);

			const { exitCode, stderr, stdout } = await runFixtureFlint();
			expect(exitCode).toBe(1);
			expect(`${stdout}\n${stderr}`).toContain(failedTransform);
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
			result = await runFixtureFlint();
		} finally {
			await writeFile(configFileName, originalConfig);
			await writeFile(flintConfigFileName, originalFlintConfig);
		}

		expect(result.exitCode).toBe(1);
		expect(`${result.stdout}\n${result.stderr}`).toContain(
			"Compiler option 'target' requires a value of type enum.",
		);
	}, 60_000);
});

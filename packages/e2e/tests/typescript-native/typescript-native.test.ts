import {
	cp,
	mkdtemp,
	readdir,
	readFile,
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

beforeAll(async () => {
	fixtureDirectory = await mkdtemp(
		path.join(tmpdir(), "flint-typescript-native-"),
	);
	await cp(sourceDirectory, fixtureDirectory, {
		filter: (source) => !source.endsWith(".test.ts"),
		recursive: true,
	});

	const packDirectory = process.env.FLINT_E2E_PACK_DIR;
	if (!packDirectory) {
		throw new Error("FLINT_E2E_PACK_DIR must point to packed Flint packages");
	}
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
	await writeFile(
		path.join(fixtureDirectory, "pnpm-workspace.yaml"),
		JSON.stringify({ overrides: packedPackages }),
	);
	await writeFile(
		path.join(fixtureDirectory, "package.json"),
		JSON.stringify({
			dependencies: {
				"@flint.fyi/astro": packedPackages["@flint.fyi/astro"],
				"@flint.fyi/svelte": packedPackages["@flint.fyi/svelte"],
				"@flint.fyi/ts": packedPackages["@flint.fyi/ts"],
				"@flint.fyi/vue": packedPackages["@flint.fyi/vue"],
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

describe("packed TypeScript native integration", () => {
	it("lints configured, inferred, referenced, Astro, Svelte, and Vue sources", async () => {
		const { exitCode, stderr, stdout } = await runFlint(fixtureDirectory);
		const output = normalizeOutput(`${stdout}\n${stderr}`, fixtureDirectory);

		expect(exitCode).toBe(1);
		for (const fileName of [
			"configured.ts",
			"inferred.js",
			"reference/referenced.ts",
			"component.astro",
			"component.svelte",
			"component.vue",
		]) {
			expect(output).toContain(fileName);
		}
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

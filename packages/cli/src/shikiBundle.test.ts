import { execFileSync } from "node:child_process";
import {
	cp,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import shikiPackage from "shiki/package.json" with { type: "json" };
import { build, type TsdownHandle } from "tsdown";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import packageJSON from "../package.json" with { type: "json" };

const packageDirectory = fileURLToPath(new URL("../", import.meta.url));
let directory: string;
let bundled: TsdownHandle;

beforeAll(async () => {
	directory = await mkdtemp(path.join(tmpdir(), "flint shiki # "));
	await cp(
		path.join(packageDirectory, "package.json"),
		path.join(directory, "package.json"),
	);
	await symlink(
		path.join(packageDirectory, "node_modules"),
		path.join(directory, "node_modules"),
		"junction",
	);
	await mkdir(path.join(directory, "dist"));
	await writeFile(
		path.join(directory, "dist", "stale.mjs"),
		"obsolete published chunk",
	);
	bundled = await build({
		attw: false,
		config: path.join(packageDirectory, "tsdown.config.ts"),
		cwd: directory,
		dts: false,
		entry: [path.join(packageDirectory, "src", "index.ts")],
		exports: false,
		logLevel: "silent",
	});
	await build({
		attw: false,
		config: false,
		cwd: directory,
		deps: { neverBundle: true },
		dts: false,
		entry: [path.join(packageDirectory, "src", "index.ts")],
		exports: false,
		logLevel: "silent",
		outDir: "upstream",
		plugins: [],
	});
}, 30_000);

afterAll(async () => {
	await rm(directory, { force: true, recursive: true });
});

describe("Shiki distribution", () => {
	it("uses the same Shiki version as the upstream ANSI renderer", async () => {
		const cliPackage = JSON.parse(
			await readFile(
				new URL("../package.json", import.meta.resolve("@shikijs/cli")),
				"utf8",
			),
		) as { dependencies: { shiki: string }; version: string };
		expect(cliPackage.version).toBe(shikiPackage.version);
		expect(cliPackage.dependencies.shiki).toBe(shikiPackage.version);
	});

	it("removes obsolete chunks before building the published directory", async () => {
		expect(await readdir(path.join(directory, "dist"))).not.toContain(
			"stale.mjs",
		);
	});

	it("ships a reviewed notice for every bundled dependency version", async () => {
		const notices = await readFile(
			path.join(packageDirectory, "THIRD_PARTY_NOTICES.md"),
			"utf8",
		);
		const dependencies = bundled.bundles.flatMap((bundle) => [
			...bundle.inlinedDeps,
		]);
		expect(dependencies.length).toBeGreaterThan(0);
		for (const [name, versions] of dependencies) {
			for (const version of versions) {
				expect(notices).toContain(`\`${name}@${version}\``);
			}
		}
		for (const component of [
			"tm-grammars@1.32.3",
			"tm-themes@1.12.3",
			"vscode-oniguruma@1.7.0",
			"Oniguruma 6.9.5_rev1",
		]) {
			expect(notices).toContain(component);
		}
		expect(packageJSON.files).toContain("THIRD_PARTY_NOTICES.md");
	});

	it("bundles only TypeScript/Nord and leaves no external Shiki dependency", () => {
		const chunks = bundled.bundles
			.flatMap((bundle) => bundle.chunks)
			.filter((chunk) => chunk.type === "chunk");
		const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules));
		for (const [name, filename] of [
			["langs", "typescript"],
			["themes", "nord"],
		]) {
			expect(
				modules.filter((id) =>
					id.replaceAll("\\", "/").includes(`/@shikijs/${name}/dist/`),
				),
			).toEqual([expect.stringContaining(`/${filename}.mjs`)]);
		}
		for (const chunk of chunks) {
			expect(
				[...chunk.imports, ...chunk.dynamicImports].filter((name) =>
					/^(?:@shikijs\/|shiki(?:\/|$)|ansis$)/.test(name),
				),
			).toEqual([]);
		}
		expect(
			Object.keys(packageJSON.dependencies).filter((name) =>
				/shiki|ansis/.test(name),
			),
		).toEqual([]);
		expect(modules.some((id) => id.includes("engine-javascript"))).toBe(false);
	});

	it.each([
		{ environment: {}, flags: [], name: "default" },
		{ environment: { NO_COLOR: "1" }, flags: [], name: "NO_COLOR" },
		...[0, 1, 2, 3].map((level) => ({
			environment: { FORCE_COLOR: `${level}` },
			flags: [],
			name: `FORCE_COLOR=${level}`,
		})),
		{ environment: {}, flags: ["--no-color"], name: "--no-color" },
		{
			environment: {},
			flags: ["--color=truecolor"],
			name: "--color=truecolor",
		},
	])("preserves upstream report bytes with $name", ({ environment, flags }) => {
		const render = (output: string): string =>
			execFileSync(
				process.execPath,
				[
					fileURLToPath(
						new URL("./fixtures/renderShikiReports.ts", import.meta.url),
					),
					path.join(directory, output),
					...flags,
				],
				{
					encoding: "utf8",
					env: {
						...process.env,
						FORCE_COLOR: undefined,
						NO_COLOR: undefined,
						...environment,
					},
				},
			);
		expect(render("dist")).toBe(render("upstream"));
	});
});

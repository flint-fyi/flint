import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import packageData from "../package.json" with { type: "json" };

describe("CLI startup", () => {
	it("reports a missing config without loading TypeScript or its patch", () => {
		const cwd = mkdtempSync(path.join(tmpdir(), "flint-cli-"));
		try {
			const result = spawnSync(
				process.execPath,
				[
					"--input-type=module",
					"--eval",
					`
						import { registerHooks } from "node:module";
						registerHooks({
							resolve(specifier, context, nextResolve) {
								if (specifier.includes("typescript") || specifier.includes("ts-patch")) {
									throw new Error("Unexpected TypeScript import: " + specifier);
								}
								return nextResolve(specifier, context);
							}
						});
						await import(${JSON.stringify(new URL("../../flint/bin/index.js", import.meta.url).href)});
					`,
				],
				{ cwd, encoding: "utf8" },
			);

			expect(result.error).toBeUndefined();
			expect(result.stderr).not.toContain("Unexpected TypeScript import:");
			expect(result.status).toBe(2);
			expect(result.stderr).toContain(
				`No flint.config.* file found in ${cwd}.`,
			);
		} finally {
			rmSync(cwd, { force: true, recursive: true });
		}
	});

	it.each([
		{ args: ["--help"], output: "Welcome to Flint!", status: 0 },
		{ args: ["--version"], output: packageData.version, status: 0 },
		{
			args: ["--help", "--version", "--watch", "--interactive"],
			output: "Welcome to Flint!",
			status: 0,
		},
		{
			args: ["--help", "--unknown-option"],
			output: "ERR_PARSE_ARGS_UNKNOWN_OPTION",
			status: 1,
		},
	])("parses $args without loading the linter", ({ args, output, status }) => {
		const allowedUrls = [
			"../../flint/bin/index.js",
			"./index.ts",
			"./runCli.ts",
			"./options.ts",
			"../package.json",
		].map((fileName) => new URL(fileName, import.meta.url).href);
		const result = spawnSync(
			process.execPath,
			[
				"--input-type=module",
				"--eval",
				`
					import { registerHooks } from "node:module";
					const allowedUrls = new Set(${JSON.stringify(allowedUrls)});
					registerHooks({
						load(url, context, nextLoad) {
							if (!url.startsWith("node:") && !allowedUrls.has(url)) {
								throw new Error("Unexpected startup import: " + url);
							}
							return nextLoad(url, context);
						}
					});
					process.argv = [process.execPath, ${JSON.stringify(allowedUrls[0])}, ...process.argv.slice(1)];
					await import(${JSON.stringify(allowedUrls[0])});
				`,
				"--",
				...args,
			],
			{ encoding: "utf8" },
		);

		expect(result.error).toBeUndefined();
		expect(result.stderr).not.toContain("Unexpected startup import:");
		expect(result.status).toBe(status);
		expect(status ? result.stderr : result.stdout).toContain(output);
	});
});

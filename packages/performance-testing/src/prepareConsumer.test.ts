import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { execa } from "execa";
import { describe, expect, it } from "vitest";

import { prepareConsumer } from "./prepareConsumer.ts";

describe(prepareConsumer, () => {
	it("installs packed transitive dependencies in an isolated consumer workspace", async () => {
		const rootPath = await fs.mkdtemp(
			path.join(os.tmpdir(), "flint performance testing "),
		);
		try {
			const casesPath = path.join(rootPath, "performance-testing", "cases");
			await Promise.all(
				(
					[
						["cli", "@flint.fyi/cli", 'module.exports = "packed CLI";'],
						["flint", "flint", 'module.exports = require("@flint.fyi/cli");'],
					] as const
				).map(async ([directory, name, source]) => {
					const packagePath = path.join(rootPath, "packages", directory);
					const manifestPath = path.join(packagePath, "package.json");
					const manifest = {
						...(name === "flint" && {
							dependencies: { "@flint.fyi/cli": "9.8.7" },
						}),
						main: "index.cjs",
						name,
						version: "9.8.7",
					};
					await fs.mkdir(packagePath, { recursive: true });
					await fs.writeFile(manifestPath, JSON.stringify(manifest));
					await fs.writeFile(path.join(packagePath, "index.cjs"), source);
					await execa("pnpm", ["pack", "--pack-destination", rootPath], {
						cwd: packagePath,
					});
					if (name === "flint") {
						await fs.writeFile(
							manifestPath,
							JSON.stringify({
								...manifest,
								dependencies: { "@flint.fyi/cli": "workspace:^" },
							}),
						);
					}
				}),
			);
			await fs.writeFile(
				path.join(rootPath, "pnpm-workspace.yaml"),
				'packages:\n  - "packages/*"\noverrides:\n  "@flint.fyi/cli": "file:./missing.tgz"\n',
			);

			await prepareConsumer(rootPath, casesPath);

			expect(
				JSON.parse(
					(await fs.readFile(path.join(casesPath, "package.json"))).toString(),
				),
			).toEqual({
				dependencies: { flint: "file:../../flint-9.8.7.tgz" },
				name: "@flint.fyi/performance-testing-cases",
				private: true,
				type: "module",
			});
			const { stdout } = await execa(
				process.execPath,
				[
					"--input-type=module",
					"-e",
					'import cli from "flint"; console.log(cli);',
				],
				{ cwd: casesPath },
			);
			expect(stdout).toBe("packed CLI");
			expect(
				await fs.readFile(path.join(casesPath, "pnpm-lock.yaml"), "utf8"),
			).toContain("file:../../flint.fyi-cli-9.8.7.tgz");
		} finally {
			await fs.rm(rootPath, { force: true, recursive: true });
		}
	}, 30_000);
});

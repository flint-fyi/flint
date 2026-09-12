import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { getFlintArtifacts } from "./getFlintArtifacts.ts";

vi.mock("execa", () => ({ execa: vi.fn() }));

const temporaryDirectories: string[] = [];

describe("consumer preparation", () => {
	afterEach(async () => {
		await Promise.all(
			temporaryDirectories.map(async (directory) => {
				await fs.rm(directory, { force: true, recursive: true });
			}),
		);
	});

	describe(getFlintArtifacts, () => {
		it("throws when a publishable artifact is unavailable", async () => {
			const rootPath = await fs.mkdtemp(
				path.join(os.tmpdir(), "flint-performance-testing-"),
			);
			temporaryDirectories.push(rootPath);
			const flintPath = path.join(rootPath, "packages", "flint");
			await fs.mkdir(flintPath, { recursive: true });
			await fs.writeFile(
				path.join(flintPath, "package.json"),
				JSON.stringify({ name: "flint", version: "1.2.3" }),
			);

			await expect(getFlintArtifacts(rootPath)).rejects.toThrow(
				`Missing packed Flint artifact: ${path.join(rootPath, "flint-1.2.3.tgz")}\nRun: pnpm build && pnpm --filter-prod flint... --filter-prod @flint.fyi/astro... --filter-prod @flint.fyi/svelte... --filter-prod @flint.fyi/vue... pack`,
			);
		});

		it("finds packed artifacts for Flint's workspace dependency closure", async () => {
			const rootPath = await fs.mkdtemp(
				path.join(os.tmpdir(), "flint-performance-testing-"),
			);
			temporaryDirectories.push(rootPath);
			const packagesPath = path.join(rootPath, "packages");
			const cliPath = path.join(packagesPath, "cli");
			const flintPath = path.join(packagesPath, "flint");
			await fs.mkdir(cliPath, { recursive: true });
			await fs.mkdir(flintPath, { recursive: true });
			await fs.writeFile(
				path.join(cliPath, "package.json"),
				JSON.stringify({ name: "@flint.fyi/cli", version: "2.3.4" }),
			);
			await fs.writeFile(
				path.join(flintPath, "package.json"),
				JSON.stringify({
					dependencies: { "@flint.fyi/cli": "workspace:" },
					name: "flint",
					version: "1.2.3",
				}),
			);
			const cliArtifactPath = path.join(rootPath, "flint.fyi-cli-2.3.4.tgz");
			const flintArtifactPath = path.join(rootPath, "flint-1.2.3.tgz");
			await fs.writeFile(cliArtifactPath, "");
			await fs.writeFile(flintArtifactPath, "");

			const actual = await getFlintArtifacts(rootPath);

			expect(actual).toEqual(
				new Map([
					["@flint.fyi/cli", cliArtifactPath],
					["flint", flintArtifactPath],
				]),
			);
		});

		it("ignores directories that are not packages", async () => {
			const rootPath = await fs.mkdtemp(
				path.join(os.tmpdir(), "flint-performance-testing-"),
			);
			temporaryDirectories.push(rootPath);
			const packagesPath = path.join(rootPath, "packages");
			const flintPath = path.join(packagesPath, "flint");
			await fs.mkdir(flintPath, { recursive: true });
			await fs.mkdir(path.join(packagesPath, "not-a-package"));
			await fs.writeFile(
				path.join(flintPath, "package.json"),
				JSON.stringify({ name: "flint", version: "1.2.3" }),
			);
			const flintArtifactPath = path.join(rootPath, "flint-1.2.3.tgz");
			await fs.writeFile(flintArtifactPath, "");

			const actual = await getFlintArtifacts(rootPath);

			expect(actual).toEqual(new Map([["flint", flintArtifactPath]]));
		});
	});
});

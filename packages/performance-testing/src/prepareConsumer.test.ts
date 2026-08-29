import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { execa } from "execa";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createConsumerPackageFile,
	getFlintArtifacts,
	prepareConsumer,
} from "./prepareConsumer.ts";

vi.mock("execa", () => ({ execa: vi.fn() }));

const mockExeca = vi.mocked(execa);
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
				`Missing packed Flint artifact: ${path.join(rootPath, "flint-1.2.3.tgz")}\nRun: pnpm build && pnpm --filter-prod flint... pack`,
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

	describe(createConsumerPackageFile, () => {
		it("installs Flint and overrides its workspace dependencies with artifacts", () => {
			const casesPath = path.join("workspace", "performance-testing", "cases");
			const artifacts = new Map([
				["@flint.fyi/cli", path.join("workspace", "flint.fyi-cli-2.3.4.tgz")],
				["flint", path.join("workspace", "flint-1.2.3.tgz")],
			]);

			const actual = createConsumerPackageFile(artifacts, casesPath);

			expect(actual).toEqual({
				dependencies: {
					flint: "file:../../flint-1.2.3.tgz",
				},
				name: "@flint.fyi/performance-testing-cases",
				pnpm: {
					overrides: {
						"@flint.fyi/cli": "file:../../flint.fyi-cli-2.3.4.tgz",
						flint: "file:../../flint-1.2.3.tgz",
					},
				},
				private: true,
				type: "module",
			});
		});
	});

	describe(prepareConsumer, () => {
		it("installs the packed packages in the generated cases directory", async () => {
			const rootPath = await fs.mkdtemp(
				path.join(os.tmpdir(), "flint-performance-testing-"),
			);
			temporaryDirectories.push(rootPath);
			const casesPath = path.join(rootPath, "performance-testing", "cases");
			const flintPath = path.join(rootPath, "packages", "flint");
			await fs.mkdir(flintPath, { recursive: true });
			await fs.writeFile(
				path.join(flintPath, "package.json"),
				JSON.stringify({ name: "flint", version: "1.2.3" }),
			);
			await fs.writeFile(path.join(rootPath, "flint-1.2.3.tgz"), "");

			await prepareConsumer(rootPath, casesPath);

			expect(
				JSON.parse(
					(await fs.readFile(path.join(casesPath, "package.json"))).toString(),
				),
			).toEqual({
				dependencies: { flint: "file:../../flint-1.2.3.tgz" },
				name: "@flint.fyi/performance-testing-cases",
				pnpm: {
					overrides: {
						flint: "file:../../flint-1.2.3.tgz",
					},
				},
				private: true,
				type: "module",
			});
			expect(mockExeca).toHaveBeenCalledWith("pnpm", [
				"install",
				"--dir",
				casesPath,
				"--ignore-workspace",
			]);
		});
	});
});

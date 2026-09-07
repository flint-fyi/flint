import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { execa } from "execa";
import { describe, expect, it, vi } from "vitest";

import { prepareConsumer } from "./prepareConsumer.ts";

vi.mock("execa", () => ({ execa: vi.fn() }));

const mockExeca = vi.mocked(execa);
const temporaryDirectories: string[] = [];

describe("consumer preparation", () => {
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

import fs from "node:fs";
import path from "node:path";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { normalizePath } from "@flint.fyi/utils";

import { createDiskBackedLinterHost } from "../host/createDiskBackedLinterHost.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import { computeUseDefinitions } from "./computeUseDefinitions.ts";

const INTEGRATION_DIR_NAME = ".flint-compute-use-definitions-integration-tests";

function findUpNodeModules(startDir: string): string {
	let current = startDir;
	while (true) {
		const candidate = path.join(current, "node_modules");
		if (fs.existsSync(candidate)) {
			return candidate;
		}
		const parent = path.dirname(current);
		if (parent === current) {
			throw new Error("Could not find node_modules directory.");
		}
		current = parent;
	}
}

describe("computeUseDefinitions", () => {
	const integrationRoot = path.join(
		findUpNodeModules(import.meta.dirname),
		INTEGRATION_DIR_NAME,
	);

	beforeEach(() => {
		fs.rmSync(integrationRoot, { force: true, recursive: true });
		fs.mkdirSync(integrationRoot, { recursive: true });
	});

	afterAll(() => {
		fs.rmSync(integrationRoot, { force: true, recursive: true });
	});

	function buildConfig(
		use: ProcessedConfigDefinition["use"],
	): ProcessedConfigDefinition {
		return {
			filePath: normalizePath(path.join(integrationRoot, "flint.config.ts")),
			use,
		};
	}

	it("returns absolute normalized file paths under cwd", async () => {
		fs.mkdirSync(path.join(integrationRoot, "src"), { recursive: true });
		fs.writeFileSync(path.join(integrationRoot, "src", "index.ts"), "");

		const host = createDiskBackedLinterHost(integrationRoot);
		const result = await computeUseDefinitions(
			host,
			buildConfig([{ files: ["**/*.ts"], rules: [] }]),
		);

		const expected = normalizePath(
			path.join(integrationRoot, "src", "index.ts"),
		);
		expect(result.allFilePaths).toEqual(new Set([expected]));
		expect(result.useDefinitions[0]?.found).toEqual(new Set([expected]));
	});

	it("excludes files under commonly-ignored directories", async () => {
		fs.mkdirSync(path.join(integrationRoot, "node_modules", "pkg"), {
			recursive: true,
		});
		fs.writeFileSync(
			path.join(integrationRoot, "node_modules", "pkg", "index.ts"),
			"",
		);
		fs.writeFileSync(path.join(integrationRoot, "keep.ts"), "");

		const host = createDiskBackedLinterHost(integrationRoot);
		const result = await computeUseDefinitions(
			host,
			buildConfig([{ files: ["**/*.ts"], rules: [] }]),
		);

		const expected = normalizePath(path.join(integrationRoot, "keep.ts"));
		const ignored = normalizePath(
			path.join(integrationRoot, "node_modules", "pkg", "index.ts"),
		);
		expect(result.allFilePaths).toEqual(new Set([expected]));
		expect(result.allFilePaths).not.toContain(ignored);
	});

	it("excludes gitignored files", async () => {
		fs.writeFileSync(path.join(integrationRoot, ".gitignore"), "dist\n");
		fs.mkdirSync(path.join(integrationRoot, "dist"), { recursive: true });
		fs.mkdirSync(path.join(integrationRoot, "src"), { recursive: true });
		fs.writeFileSync(path.join(integrationRoot, "dist", "bundle.js"), "");
		fs.writeFileSync(path.join(integrationRoot, "src", "index.ts"), "");

		const host = createDiskBackedLinterHost(integrationRoot);
		const result = await computeUseDefinitions(
			host,
			buildConfig([{ files: ["**/*"], rules: [] }]),
		);

		const kept = normalizePath(path.join(integrationRoot, "src", "index.ts"));
		const ignored = normalizePath(
			path.join(integrationRoot, "dist", "bundle.js"),
		);
		expect(result.allFilePaths).toContain(kept);
		expect(result.allFilePaths).not.toContain(ignored);
		expect([...result.allFilePaths].some((p) => p.includes("/dist/"))).toBe(
			false,
		);
	});
});

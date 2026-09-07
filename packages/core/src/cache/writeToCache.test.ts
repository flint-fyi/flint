import assert from "node:assert/strict";
import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import type { VFSLinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { cacheStorageSchema } from "./cacheSchema.ts";
import { writeToCache } from "./writeToCache.ts";

const cwd = resolve("virtual-project");
const configFileName = "flint.config.ts";

const lintResults: LintResults = {
	allFilePaths: new Set(["src/a.ts"]),
	allFileResults: new Map([
		[
			"src/a.ts",
			{
				dependencies: new Set<string>(),
				invalidatesCache: true,
				languageReports: [],
				reports: [],
			},
		],
	]),
	cached: undefined,
	ruleCount: 1,
};

function createHost(): VFSLinterHost {
	vi.spyOn(Date, "now").mockReturnValue(1_000);
	const host = createVFSLinterHost({ caseSensitive: true, cwd });
	for (const fileName of [configFileName, "package.json", "src/a.ts"]) {
		host.vfsUpsertFile(resolve(cwd, fileName), "");
	}
	vi.spyOn(Date, "now").mockReturnValue(2_000);
	return host;
}

describe(writeToCache, () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("resolves the cache file and touch times against the host cwd", async () => {
		const host = createHost();

		await writeToCache(host, configFileName, lintResults, undefined);

		expect(cwd).not.toBe(process.cwd());
		const written = await host.readFile(
			resolve(cwd, "node_modules/.cache/flint.json"),
		);
		assert.ok(written);
		const decoded = cacheStorageSchema.safeDecode(written);
		assert.ok(decoded.success);
		expect(decoded.data).toEqual({
			configs: { [configFileName]: 1_000, "package.json": 1_000 },
			files: { "src/a.ts": { timestamp: 2_000 } },
			globalInvalidations: [{ filePath: "src/a.ts", touchTime: 1_000 }],
		});
	});

	it("resolves a relative cache location against the host cwd", async () => {
		const host = createHost();

		await writeToCache(host, configFileName, lintResults, "custom/cache-dir");

		expect(
			await host.readFile(resolve(cwd, "custom/cache-dir/flint.json")),
		).toBeDefined();
	});
});

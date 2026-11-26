import { afterEach, describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import type { CacheStorage } from "../types/cache.ts";
import type { VFSLinterHost } from "../types/host.ts";
import { cacheStorageSchema } from "./cacheFormat.ts";
import { readFromCache } from "./readFromCache.ts";

const cacheFilePath = "/root/cache.json";
const configFilePath = "/root/flint.config.ts";
const dependencyPath = "/root/tsconfig.json";
const filePath = "/root/src/index.ts";

const cacheWriteTime = 3000;

function createHostWithCache(
	files: Record<string, number>,
	cachedFiles: CacheStorage["files"],
) {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });

	for (const [path, touchTime] of Object.entries(files)) {
		vi.setSystemTime(touchTime);
		host.vfsUpsertFile(path, "");
	}

	const storage: CacheStorage = {
		configs: {
			[configFilePath]: cacheWriteTime,
		},
		files: cachedFiles,
	};

	host.vfsUpsertFile(cacheFilePath, cacheStorageSchema.encode(storage));

	return host;
}

async function read(host: VFSLinterHost, allFilePaths: string[]) {
	const checkpoint = await readFromCache(
		host,
		new Set(allFilePaths),
		configFilePath,
		cacheFilePath,
	);
	return checkpoint && Array.from(checkpoint.changedFilePaths);
}

describe(readFromCache, () => {
	vi.useFakeTimers();

	afterEach(() => {
		vi.useRealTimers();
	});

	it("reports no changes when a file has no dependencies", async () => {
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[filePath]: 2000,
			},
			{
				[filePath]: {
					timestamp: cacheWriteTime,
				},
			},
		);

		expect(await read(host, [filePath])).toEqual([]);
	});

	it("reports no changes when a dependency outside the lint set was not touched after the cache was written", async () => {
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[dependencyPath]: 1000,
				[filePath]: 2000,
			},
			{
				[filePath]: {
					dependencies: [dependencyPath],
					timestamp: cacheWriteTime,
				},
			},
		);

		expect(await read(host, [filePath])).toEqual([]);
	});

	it("reports a dependency outside the lint set that was touched after the cache was written", async () => {
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[dependencyPath]: 4000,
				[filePath]: 2000,
			},
			{
				[filePath]: {
					dependencies: [dependencyPath],
					timestamp: cacheWriteTime,
				},
			},
		);

		expect(await read(host, [filePath])).toEqual([dependencyPath]);
	});

	it("reports a dependency outside the lint set that no longer exists", async () => {
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[filePath]: 2000,
			},
			{
				[filePath]: {
					dependencies: [dependencyPath],
					timestamp: cacheWriteTime,
				},
			},
		);

		expect(await read(host, [filePath])).toEqual([dependencyPath]);
	});

	it("reports no changes when a missing dependency is still missing", async () => {
		const host = createHostWithCache(
			{ [configFilePath]: 1000, [filePath]: 2000 },
			{
				[filePath]: {
					missingDependencies: [dependencyPath],
					timestamp: cacheWriteTime,
				},
			},
		);

		expect(await read(host, [filePath])).toEqual([]);
	});

	it("reports a missing dependency that exists, even if touched before the cache was written", async () => {
		const host = createHostWithCache(
			{ [configFilePath]: 1000, [dependencyPath]: 1000, [filePath]: 2000 },
			{
				[filePath]: {
					missingDependencies: [dependencyPath],
					timestamp: cacheWriteTime,
				},
			},
		);

		expect(await read(host, [filePath])).toEqual([dependencyPath]);
	});

	it.each([
		["touched after the cache was written", { [configFilePath]: 4000 }],
		["deleted", {}],
	])(
		"discards the cache when the Flint config was %s",
		async (_description, configFiles) => {
			const host = createHostWithCache(
				{ ...configFiles, [filePath]: 2000 },
				{ [filePath]: { timestamp: cacheWriteTime } },
			);

			expect(await read(host, [filePath])).toBeUndefined();
		},
	);

	it("discards the cache when it was written for a different Flint config", async () => {
		const otherConfigFilePath = "/root/flint.config.js";
		const host = createHostWithCache(
			{ [filePath]: 2000, [otherConfigFilePath]: 1000 },
			{ [filePath]: { timestamp: cacheWriteTime } },
		);

		expect(
			await readFromCache(
				host,
				new Set([filePath]),
				otherConfigFilePath,
				cacheFilePath,
			),
		).toBeUndefined();
	});

	it("keeps the cache when a package.json no file depends on changes", async () => {
		const host = createHostWithCache(
			{ [configFilePath]: 1000, [filePath]: 2000, "package.json": 4000 },
			{ [filePath]: { timestamp: cacheWriteTime } },
		);

		expect(await read(host, [filePath])).toEqual([]);
	});

	it("reports a file inside the lint set that was touched after the cache was written", async () => {
		const dependentPath = "/root/src/dependent.ts";
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[dependencyPath]: 1000,
				[dependentPath]: 2000,
				[filePath]: 4000,
			},
			{
				[dependentPath]: {
					dependencies: [dependencyPath, filePath],
					timestamp: cacheWriteTime,
				},
				[filePath]: {
					dependencies: [dependencyPath],
					timestamp: cacheWriteTime,
				},
			},
		);

		expect(await read(host, [dependentPath, filePath])).toEqual([filePath]);
	});
});

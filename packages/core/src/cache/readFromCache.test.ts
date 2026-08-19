import { afterEach, describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import type { CacheStorage } from "../types/cache.ts";
import type { VFSLinterHost } from "../types/host.ts";
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
			"package.json": cacheWriteTime,
		},
		files: cachedFiles,
		globalInvalidations: [],
	};

	host.vfsUpsertFile(cacheFilePath, JSON.stringify(storage));

	return host;
}

function read(host: VFSLinterHost, allFilePaths: string[]) {
	return readFromCache(
		host,
		new Set(allFilePaths),
		configFilePath,
		cacheFilePath,
	);
}

describe(readFromCache, () => {
	vi.useFakeTimers();

	afterEach(() => {
		vi.useRealTimers();
	});

	it("keeps a file cached when a dependency outside the lint set was not touched after the cache was written", async () => {
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[dependencyPath]: 1000,
				[filePath]: 2000,
				"package.json": 1000,
			},
			{
				[filePath]: {
					dependencies: [dependencyPath],
					timestamp: cacheWriteTime,
				},
			},
		);

		const cached = await read(host, [filePath]);

		expect(cached && Array.from(cached.keys())).toEqual([filePath]);
	});

	it("invalidates a file when a dependency outside the lint set was touched after the cache was written", async () => {
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[dependencyPath]: 4000,
				[filePath]: 2000,
				"package.json": 1000,
			},
			{
				[filePath]: {
					dependencies: [dependencyPath],
					timestamp: cacheWriteTime,
				},
			},
		);

		const cached = await read(host, [filePath]);

		expect(cached && Array.from(cached.keys())).toEqual([]);
	});

	it("invalidates a file when a dependency outside the lint set no longer exists", async () => {
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[filePath]: 2000,
				"package.json": 1000,
			},
			{
				[filePath]: {
					dependencies: [dependencyPath],
					timestamp: cacheWriteTime,
				},
			},
		);

		const cached = await read(host, [filePath]);

		expect(cached && Array.from(cached.keys())).toEqual([]);
	});

	it("invalidates dependents when a dependency inside the lint set was touched after the cache was written", async () => {
		const dependentPath = "/root/src/dependent.ts";
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[dependencyPath]: 1000,
				[dependentPath]: 2000,
				[filePath]: 4000,
				"package.json": 1000,
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

		const cached = await read(host, [dependentPath, filePath]);

		expect(cached && Array.from(cached.keys())).toEqual([]);
	});
});

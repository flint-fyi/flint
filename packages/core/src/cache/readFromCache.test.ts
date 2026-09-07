import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import type { CacheStorage } from "../types/cache.ts";
import type { VFSLinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { readFromCache } from "./readFromCache.ts";
import { writeToCache } from "./writeToCache.ts";

const cwd = resolve("virtual-project");
const cacheFilePath = resolve(cwd, "cache.json");
const configFileName = "flint.config.ts";
const configFilePath = resolve(cwd, configFileName);
const dependencyPath = resolve(cwd, "tsconfig.json");
const filePath = resolve(cwd, "src/index.ts");
const packageJsonPath = resolve(cwd, "package.json");
const relativeFilePaths = ["src/a.ts", "src/b.ts"];

const cacheWriteTime = 3000;

async function createCachedHost(
	invalidatesCache = false,
): Promise<VFSLinterHost> {
	vi.setSystemTime(1_000);
	const host = createVFSLinterHost({ caseSensitive: true, cwd });
	for (const fileName of [
		configFileName,
		"package.json",
		...relativeFilePaths,
	]) {
		host.vfsUpsertFile(resolve(cwd, fileName), "");
	}
	vi.setSystemTime(2_000);
	await writeToCache(
		host,
		configFileName,
		createLintResults(invalidatesCache),
		undefined,
	);
	vi.setSystemTime(3_000);
	return host;
}

function createHostWithCache(
	files: Record<string, number>,
	cachedFiles: CacheStorage["files"],
) {
	const host = createVFSLinterHost({ caseSensitive: true, cwd });

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

function createLintResults(invalidatesCache: boolean): LintResults {
	return {
		allFilePaths: new Set(relativeFilePaths),
		allFileResults: new Map(
			relativeFilePaths.map((relativeFilePath) => [
				relativeFilePath,
				{
					dependencies: new Set<string>(),
					invalidatesCache,
					languageReports: [],
					reports: [],
				},
			]),
		),
		cached: undefined,
		ruleCount: 1,
	};
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

	it("keeps a file cached when it has no dependencies", async () => {
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[filePath]: 2000,
				[packageJsonPath]: 1000,
			},
			{
				[filePath]: {
					timestamp: cacheWriteTime,
				},
			},
		);

		const cached = await read(host, [filePath]);

		expect(cached && Array.from(cached.keys())).toEqual([filePath]);
	});

	it("keeps a file cached when a dependency outside the lint set was not touched after the cache was written", async () => {
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[dependencyPath]: 1000,
				[filePath]: 2000,
				[packageJsonPath]: 1000,
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
				[packageJsonPath]: 1000,
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
				[packageJsonPath]: 1000,
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
		const dependentPath = resolve(cwd, "src/dependent.ts");
		const host = createHostWithCache(
			{
				[configFilePath]: 1000,
				[dependencyPath]: 1000,
				[dependentPath]: 2000,
				[filePath]: 4000,
				[packageJsonPath]: 1000,
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

	it("returns cached files when nothing was touched after the cache", async () => {
		const host = await createCachedHost();

		expect(cwd).not.toBe(process.cwd());
		expect(
			await readFromCache(
				host,
				new Set(relativeFilePaths),
				configFileName,
				undefined,
			),
		).toEqual(
			new Map(
				relativeFilePaths.map((relativeFilePath) => [
					relativeFilePath,
					{ timestamp: 2_000 },
				]),
			),
		);
	});

	it("invalidates everything when package.json is touched after the cache", async () => {
		const host = await createCachedHost();
		host.vfsUpsertFile(packageJsonPath, "{}");

		expect(
			await readFromCache(
				host,
				new Set(relativeFilePaths),
				configFileName,
				undefined,
			),
		).toBeUndefined();
	});

	it("re-lints only files touched after the cache", async () => {
		const host = await createCachedHost();
		host.vfsUpsertFile(resolve(cwd, "src/b.ts"), "changed");

		expect(
			await readFromCache(
				host,
				new Set(relativeFilePaths),
				configFileName,
				undefined,
			),
		).toEqual(new Map([["src/a.ts", { timestamp: 2_000 }]]));
	});

	it("returns cached files when cache-invalidating files are untouched", async () => {
		const host = await createCachedHost(true);

		expect(
			await readFromCache(
				host,
				new Set(relativeFilePaths),
				configFileName,
				undefined,
			),
		).toEqual(
			new Map(
				relativeFilePaths.map((relativeFilePath) => [
					relativeFilePath,
					{ timestamp: 2_000 },
				]),
			),
		);
	});

	it("invalidates everything when a cache-invalidating file is touched", async () => {
		const host = await createCachedHost(true);
		host.vfsUpsertFile(resolve(cwd, "src/a.ts"), "changed");

		expect(
			await readFromCache(
				host,
				new Set(relativeFilePaths),
				configFileName,
				undefined,
			),
		).toBeUndefined();
	});
});

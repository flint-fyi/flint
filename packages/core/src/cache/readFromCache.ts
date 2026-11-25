import { debugForFile } from "debug-for-file";

import { nullThrows, pathKey } from "@flint.fyi/utils";

import type { FileCacheStorage } from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import { cacheStorageSchema } from "./cacheFormat.ts";
import { getCacheFilePath } from "./getCacheFilePath.ts";

const log = debugForFile(import.meta.url);

export async function readFromCache(
	host: LinterHost,
	allFilePaths: Set<string>,
	configFilePath: string,
	cacheLocation: string | undefined,
): Promise<Map<string, FileCacheStorage> | undefined> {
	const cacheFilePath = getCacheFilePath(cacheLocation);
	const rawCacheString = await host.readFile(cacheFilePath);

	if (!rawCacheString) {
		log("Linting all %d file path(s) due to lack of cache.", allFilePaths.size);
		return undefined;
	}

	const decodeResult = cacheStorageSchema.safeDecode(rawCacheString);
	if (!decodeResult.success) {
		log(
			"Linting all %d file path(s) due to invalid cache data: %s",
			allFilePaths.size,
			decodeResult.error.message,
		);
		return undefined;
	}

	const cache = decodeResult.data;
	const caseSensitiveFS = host.isCaseSensitiveFS();
	const allFilePathKeys = new Set(
		Array.from(allFilePaths, (filePath) => pathKey(filePath, caseSensitiveFS)),
	);

	// The config file and package.json are hardcoded to always be dependencies of all files
	for (const filePath of [configFilePath, "package.json"]) {
		if (!Object.hasOwn(cache.configs, filePath)) {
			log(
				"Linting all %d file path(s) due to no cache of %s",
				allFilePaths.size,
				filePath,
			);
			return undefined;
		}

		const timestampCached = nullThrows(
			cache.configs[filePath],
			"Cache timestamp is expected to be present",
		);
		// flint-disable-next-line performance/loopAwaits
		const timestampTouched = await host.getFileTouchTime(filePath);
		if (timestampTouched == null || timestampTouched > timestampCached) {
			log(
				"Linting all %d file path(s) due to %s touch timestamp %d after cache timestamp %d",
				allFilePaths.size,
				filePath,
				timestampTouched,
				timestampCached,
			);
			return undefined;
		}
	}

	const cached = new Map(Object.entries(cache.files));
	const dependencyTouchTimes = new Map<string, number | undefined>();

	for (const [filePath, fileCached] of cached) {
		if (!fileCached.isGlobalDependency) {
			continue;
		}

		// flint-disable-next-line performance/loopAwaits
		const currentTouchTime = await host.getFileTouchTime(filePath);
		if (currentTouchTime == null || currentTouchTime > fileCached.timestamp) {
			log(
				"Linting all %d file(s) because cache-invalidating file %s has changed (current: %d, cached: %d)",
				allFilePaths.size,
				filePath,
				currentTouchTime,
				fileCached.timestamp,
			);
			return undefined;
		}
	}

	// Any files touched since last cache write will need to be re-linted
	for (const filePath of allFilePaths) {
		const fileCached = cached.get(filePath);
		if (!fileCached) {
			log("No cache available for: %s", filePath);
			continue;
		}

		// flint-disable-next-line performance/loopAwaits
		if (await hasOutdatedDependency(filePath, fileCached)) {
			cached.delete(filePath);
			continue;
		}

		const timestampCached = fileCached.timestamp;
		// flint-disable-next-line performance/loopAwaits
		const timestampTouched = await host.getFileTouchTime(filePath);
		if (timestampTouched == null || timestampTouched > timestampCached) {
			log(
				"Directly invalidating cache for: %s due to touch timestamp %d after cache timestamp %d",
				filePath,
				timestampTouched,
				timestampCached,
			);
			cached.delete(filePath);
		}
	}

	// Remove cached files that no longer exist
	for (const filePath of cached.keys()) {
		if (!allFilePaths.has(filePath)) {
			cached.delete(filePath);
			log("Removing non-existent file from cache: %s", filePath);
		}
	}

	log(
		"Retrieved from %s: %d file(s) cached out of %d",
		cacheFilePath,
		cached.size,
		allFilePaths.size,
	);
	return cached;

	async function getDependencyTouchTime(dependency: string) {
		if (dependencyTouchTimes.has(dependency)) {
			return dependencyTouchTimes.get(dependency);
		}

		const touchTime = await host.getFileTouchTime(dependency);
		dependencyTouchTimes.set(dependency, touchTime);
		return touchTime;
	}

	async function hasOutdatedDependency(
		filePath: string,
		fileCached: FileCacheStorage,
	) {
		for (const dependency of fileCached.dependencies ?? []) {
			if (allFilePathKeys.has(pathKey(dependency, caseSensitiveFS))) {
				continue;
			}

			// flint-disable-next-line performance/loopAwaits
			const timestampTouched = await getDependencyTouchTime(dependency);
			if (timestampTouched == null || timestampTouched > fileCached.timestamp) {
				log(
					"Directly invalidating cache for: %s due to dependency %s touch timestamp %d after cache timestamp %d",
					filePath,
					dependency,
					timestampTouched,
					fileCached.timestamp,
				);
				return true;
			}
		}

		return false;
	}
}

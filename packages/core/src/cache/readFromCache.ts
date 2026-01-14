import { nullThrows } from "@flint.fyi/utils";
import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";

import { readFileSafeAsJson } from "../running/readFileSafeAsJson.ts";
import type { CacheStorage, FileCacheStorage } from "../types/cache.ts";
import { cacheFilePath } from "./constants.ts";
import { getFileTouchTime } from "./getFileTouchTime.ts";

const log = debugForFile(import.meta.filename);

export async function readFromCache(
	allFilePaths: Set<string>,
	configFilePath: string,
): Promise<Map<string, FileCacheStorage> | undefined> {
	// TODO: Add some kind of validation to cache data
	// https://github.com/flint-fyi/flint/issues/114
	const cache = (await readFileSafeAsJson(cacheFilePath)) as
		| CacheStorage
		| undefined;

	if (!cache) {
		log("Linting all %d file path(s) due to lack of cache.", allFilePaths.size);
		return undefined;
	}

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
		const timestampTouched = getFileTouchTime(filePath);
		if (timestampTouched > timestampCached) {
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
	const filePathsToLint = new Set<string>();

	// Any files touched since last cache write will need to be re-linted
	for (const filePath of allFilePaths) {
		const fileCached = cached.get(filePath);
		if (!fileCached) {
			log("No cache available for: %s", filePath);
			markAsUncached(filePath);
			continue;
		}

		if (fileCached.dependencies) {
			for (const dependency of fileCached.dependencies) {
				if (!allFilePaths.has(dependency)) {
					log(
						"Directly invalidating cache for: %s due to dependency %s not being in linted files cache",
						filePath,
						dependency,
					);
					markAsUncached(filePath);
					continue;
				}
			}
		}

		const timestampCached = fileCached.timestamp;
		const timestampTouched = getFileTouchTime(filePath);
		if (timestampTouched > timestampCached) {
			log(
				"Directly invalidating cache for: %s due to touch timestamp %d after cache timestamp %d",
				filePath,
				timestampTouched,
				timestampCached,
			);
			markAsUncached(filePath);
		}
	}

	// We also invalidate the cache for any dependents of changed files.
	// But the cache stores dependencies, so we have to reverse that map now.
	const fileDependents = new CachedFactory(() => new Set<string>());

	for (const [filePath, stored] of cached) {
		if (stored.dependencies) {
			for (const dependency of stored.dependencies) {
				fileDependents.get(dependency).add(filePath);
			}
		}
	}

	const transitivelyCheckedForChanges = new Set<string>();
	const transitivelyImpactedByChanges = Array.from(filePathsToLint);

	for (const filePath of transitivelyImpactedByChanges) {
		const dependents = fileDependents.get(filePath);
		for (const dependent of dependents) {
			if (!transitivelyCheckedForChanges.has(dependent)) {
				log("Transitively invalidating cache for: %s", dependent);
				markAsUncached(dependent);
				transitivelyCheckedForChanges.add(dependent);
				transitivelyImpactedByChanges.push(dependent);
			}
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

	function markAsUncached(filePath: string) {
		cached.delete(filePath);
		filePathsToLint.add(filePath);
	}
}

import { debugForFile } from "debug-for-file";
import { resolve } from "pathe";

import { pathKey } from "@flint.fyi/utils";

import type { FileCacheStorage } from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import { cacheStorageSchema } from "./cacheFormat.ts";
import { getCacheFilePath } from "./getCacheFilePath.ts";

const log = debugForFile(import.meta.url);

export interface ValidatedCacheCheckpoint {
	changedFilePaths: Set<string>;
	files: Map<string, FileCacheStorage>;
}

export async function readFromCache(
	host: LinterHost,
	allFilePaths: Set<string>,
	configFilePath: string,
	cacheLocation: string | undefined,
): Promise<undefined | ValidatedCacheCheckpoint> {
	const rawCacheString = await host.readFile(getCacheFilePath(cacheLocation));
	if (!rawCacheString) {
		return undefined;
	}
	const decoded = cacheStorageSchema.safeDecode(rawCacheString);
	if (!decoded.success) {
		log("Ignoring an incompatible cache checkpoint.");
		return undefined;
	}
	const cache = decoded.data;

	// The config file and package.json are hardcoded to always be dependencies of all files
	for (const filePath of [configFilePath, "package.json"]) {
		const timestamp = cache.configs[filePath];
		// flint-disable-next-line performance/loopAwaits
		const touchTime = await host.getFileTouchTime(filePath);
		if (
			timestamp === undefined ||
			touchTime === undefined ||
			touchTime > timestamp
		) {
			return undefined;
		}
	}

	const changedFilePaths = new Set<string>();
	const files = new Map(Object.entries(cache.files));
	const allFileKeys = new Set(
		Array.from(allFilePaths, (filePath) =>
			pathKey(
				resolve(host.getCurrentDirectory(), filePath),
				host.isCaseSensitiveFS(),
			),
		),
	);
	const touchTimes = new Map<string, number | undefined>();
	for (const [filePath, file] of files) {
		// flint-disable-next-line performance/loopAwaits
		const touched = await host.getFileTouchTime(filePath);
		if (touched === undefined || touched > file.timestamp) {
			changedFilePaths.add(filePath);
		}
		for (const dependency of file.dependencies ?? []) {
			if (
				allFileKeys.has(
					pathKey(
						resolve(host.getCurrentDirectory(), dependency),
						host.isCaseSensitiveFS(),
					),
				)
			) {
				continue;
			}
			if (!touchTimes.has(dependency)) {
				// flint-disable-next-line performance/loopAwaits
				touchTimes.set(dependency, await host.getFileTouchTime(dependency));
			}
			const touched = touchTimes.get(dependency);
			if (touched === undefined || touched > file.timestamp) {
				changedFilePaths.add(dependency);
			}
		}
	}
	for (const filePath of allFilePaths.difference(files)) {
		changedFilePaths.add(filePath);
	}
	return { changedFilePaths, files };
}

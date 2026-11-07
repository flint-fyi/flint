import { debugForFile } from "debug-for-file";
import { resolve } from "pathe";

import { pathKey } from "@flint.fyi/utils";

import type { FileCacheStorage } from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import { cacheStorageSchema } from "./cacheSchema.ts";
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
	if (!decoded.success || decoded.data.version !== 3) {
		log("Ignoring an incompatible cache checkpoint.");
		return undefined;
	}
	const cache = decoded.data;
	const configTimestamp = cache.configs[configFilePath];
	const configTouchTime = await host.getFileTouchTime(configFilePath);
	if (
		configTimestamp === undefined ||
		configTouchTime === undefined ||
		configTouchTime > configTimestamp
	) {
		return undefined;
	}

	const changedFilePaths = new Set<string>();
	for (const [filePath, timestamp] of Object.entries(cache.configs)) {
		if (
			filePath !== configFilePath &&
			// flint-disable-next-line performance/loopAwaits
			((await host.getFileTouchTime(filePath)) ?? 0) !== timestamp
		) {
			changedFilePaths.add(filePath);
		}
	}
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

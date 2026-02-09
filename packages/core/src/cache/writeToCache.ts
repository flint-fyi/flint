import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";
import * as fs from "node:fs/promises";
import { dirname } from "node:path";
import omitEmpty from "omit-empty";

import type { CacheStorage } from "../types/cache.ts";
import type { LintResults } from "../types/linting.ts";
import { cacheStorageSchema } from "./cacheSchema.ts";
import { getCacheFilePath } from "./getCacheFilePath.ts";
import { getFileTouchTime } from "./getFileTouchTime.ts";

const log = debugForFile(import.meta.filename);

export async function writeToCache(
	configFileName: string,
	lintResults: LintResults,
	cacheLocation: string | undefined,
) {
	const fileDependents = new CachedFactory(() => new Set<string>());
	const timestamp = Date.now();

	for (const [filePath, fileResult] of lintResults.filesResults) {
		for (const dependency of fileResult.dependencies) {
			fileDependents.get(dependency).add(filePath);
		}
	}

	const storage: CacheStorage = {
		configs: {
			[configFileName]: getFileTouchTime(configFileName),
			"package.json": getFileTouchTime("package.json"),
		},
		files: {
			...Object.fromEntries(
				Array.from(lintResults.filesResults).map(([filePath, fileResults]) => [
					filePath,
					{
						...omitEmpty({
							dependencies: Array.from(fileResults.dependencies).sort(),
							diagnostics: fileResults.diagnostics,
							reports: fileResults.reports,
						}),
						timestamp,
					},
				]),
			),
			...(lintResults.cached &&
				Object.fromEntries(
					Array.from(lintResults.cached).filter(([filePath]) =>
						lintResults.allFilePaths.has(filePath),
					),
				)),
		},
	};

	const cacheFilePath = getCacheFilePath(cacheLocation);
	const cacheFileDirectory = dirname(cacheFilePath);

	await fs.mkdir(cacheFileDirectory, { recursive: true });

	const encoded = cacheStorageSchema.safeEncode(storage);
	if (!encoded.success) {
		log("Failed to encode cache data: %s", encoded.error.message);
		return;
	}

	await fs.writeFile(cacheFilePath, encoded.data);
}

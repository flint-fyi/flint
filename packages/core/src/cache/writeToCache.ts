import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";
import omitEmpty from "omit-empty";

import type { CacheStorage, GlobalInvalidation } from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { cacheStorageSchema } from "./cacheSchema.ts";
import { getCacheFilePath } from "./getCacheFilePath.ts";

const log = debugForFile(import.meta.filename);

export async function writeToCache(
	host: LinterHost,
	configFileName: string,
	lintResults: LintResults,
	cacheLocation: string | undefined,
) {
	const fileDependents = new CachedFactory(() => new Set<string>());
	const timestamp = Date.now();
	const globalInvalidations: GlobalInvalidation[] = [];

	for (const [filePath, fileResult] of lintResults.allFileResults) {
		if (fileResult.invalidatesCache) {
			globalInvalidations.push({
				filePath,
				// Fall back to 0 (not the current time) when the host can't report a
				// touch time: a fabricated "now" would mask later changes, whereas 0
				// forces a safe re-validation on the next run.
				// flint-disable-next-line performance/loopAwaits
				touchTime: (await host.getFileTouchTime(filePath)) ?? 0,
			});
		}
		for (const dependency of fileResult.dependencies) {
			fileDependents.get(dependency).add(filePath);
		}
	}

	const storage: CacheStorage = {
		configs: {
			// Fall back to 0 (not the current time) when the host can't report a
			// touch time: a fabricated "now" would mask later changes, whereas 0
			// forces a safe re-validation on the next run.
			[configFileName]: (await host.getFileTouchTime(configFileName)) ?? 0,
			"package.json": (await host.getFileTouchTime("package.json")) ?? 0,
		},
		files: {
			...Object.fromEntries(
				Array.from(lintResults.allFileResults).map(
					([filePath, fileResults]) => [
						filePath,
						{
							...omitEmpty({
								dependencies: Array.from(fileResults.dependencies).sort(),
								languageReports: fileResults.languageReports,
								reports: fileResults.reports,
							}),
							timestamp,
						},
					],
				),
			),
			...(lintResults.cached &&
				Object.fromEntries(
					Array.from(lintResults.cached).filter(([filePath]) =>
						lintResults.allFilePaths.has(filePath),
					),
				)),
		},
		globalInvalidations,
	};

	const encoded = cacheStorageSchema.safeEncode(storage);
	if (!encoded.success) {
		log("Failed to encode cache data: %s", encoded.error.message);
		return;
	}

	const cacheFilePath = getCacheFilePath(cacheLocation);
	await host.writeFile(cacheFilePath, encoded.data);
}

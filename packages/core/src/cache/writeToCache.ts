import { debugForFile } from "debug-for-file";
import omitEmpty from "omit-empty";

import type { CacheStorage } from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { cacheStorageSchema } from "./cacheSchema.ts";
import { getCacheFilePath } from "./getCacheFilePath.ts";

const log = debugForFile(import.meta.url);

export async function writeToCache(
	host: LinterHost,
	configFileName: string,
	lintResults: LintResults,
	cacheLocation: string | undefined,
): Promise<void> {
	const timestamp = Date.now();

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
							invalidatesCache: fileResults.invalidatesCache ?? false,
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
	};

	const encoded = cacheStorageSchema.safeEncode(storage);
	if (!encoded.success) {
		log("Failed to encode cache data: %s", encoded.error.message);
		return;
	}

	const cacheFilePath = getCacheFilePath(cacheLocation);
	await host.writeFile(cacheFilePath, encoded.data);
}

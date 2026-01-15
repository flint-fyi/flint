import { CachedFactory } from "cached-factory";
import * as fs from "node:fs/promises";
import omitEmpty from "omit-empty";

import type { CacheStorage } from "../types/cache.ts";
import type { LintResults } from "../types/linting.ts";
import { cacheFileDirectory, cacheFilePath } from "./constants.ts";
import { getFileTouchTime } from "./getFileTouchTime.ts";

export async function writeToCache(
	configFileName: string,
	lintResults: LintResults,
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

	await fs.mkdir(cacheFileDirectory, { recursive: true });
	await fs.writeFile(cacheFilePath, JSON.stringify(storage, null, "\t"));
}

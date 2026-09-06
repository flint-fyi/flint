import { readFromCache } from "../cache/readFromCache.ts";
import { writeToCache } from "../cache/writeToCache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { LintSession } from "./LintSession.ts";

export interface RunConfigOptions {
	cacheLocation?: string | undefined;
	ignoreCache?: boolean;
	skipCacheWrite?: boolean;
	skipLanguageReports?: boolean;
}

export async function runConfig(
	configDefinition: ProcessedConfigDefinition,
	host: LinterHost,
	{
		cacheLocation: cacheLocationFromCli,
		ignoreCache,
		skipCacheWrite,
		skipLanguageReports,
	}: RunConfigOptions,
): Promise<LintResults> {
	const cacheLocationOverride =
		cacheLocationFromCli || configDefinition.cacheLocation;

	using session = await LintSession.create(configDefinition, host);

	const cached = ignoreCache
		? undefined
		: await readFromCache(
				host,
				session.allFilePaths,
				configDefinition.filePath,
				cacheLocationOverride,
			);

	const lintedResults = await session.lintFiles(
		cached
			? session.allFilePaths.difference(new Set(cached.keys()))
			: session.allFilePaths,
		{ skipLanguageReports: skipLanguageReports ?? false },
	);

	const allFileResults = new Map(lintedResults);
	for (const filePath of lintedResults.keys()) {
		cached?.delete(filePath);
	}

	if (cached) {
		for (const [filePath, cachedStorage] of cached) {
			allFileResults.set(filePath, {
				dependencies: new Set(cachedStorage.dependencies),
				languageReports: cachedStorage.languageReports ?? [],
				reports: cachedStorage.reports ?? [],
			});
		}
	}

	const lintResults: LintResults = {
		allFilePaths: session.allFilePaths,
		allFileResults,
		cached,
		ruleCount: session.ruleCount,
	};

	if (!skipCacheWrite) {
		await writeToCache(
			host,
			configDefinition.filePath,
			lintResults,
			cacheLocationOverride,
		);
	}

	return lintResults;
}

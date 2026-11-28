import { writeToCache } from "../cache/writeToCache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type { LintResultsWithChanges } from "../types/linting.ts";
import { LintSession } from "./LintSession.ts";
import { lintSessionWithCache } from "./lintSessionWithCache.ts";

export interface RunConfigFixingOptions {
	cacheLocation?: string | undefined;
	ignoreCache: boolean;
	requestedSuggestions: Set<string>;
	skipLanguageReports: boolean;
}

export async function runConfigFixing(
	configDefinition: ProcessedConfigDefinition,
	host: LinterHost,
	{
		cacheLocation: requestedCacheLocation,
		ignoreCache,
		requestedSuggestions,
		skipLanguageReports,
	}: RunConfigFixingOptions,
): Promise<LintResultsWithChanges> {
	const cacheLocation =
		requestedCacheLocation || configDefinition.cacheLocation;

	using session = await LintSession.create(configDefinition, host);

	const { changed } = await session.fixFiles(
		(
			await lintSessionWithCache(session, configDefinition.filePath, host, {
				cacheLocation,
				ignoreCache,
				skipLanguageReports,
			})
		).allFileResults,
		{ requestedSuggestions, skipLanguageReports },
	);
	const lintResults = session.getResults();

	await writeToCache(
		host,
		configDefinition.filePath,
		lintResults,
		cacheLocation,
	);

	return { ...lintResults, changed };
}

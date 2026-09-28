import { writeToCache } from "../cache/writeToCache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { LintSession } from "./LintSession.ts";
import { lintSessionWithCache } from "./lintSessionWithCache.ts";

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

	const lintResults = await lintSessionWithCache(
		session,
		configDefinition.filePath,
		host,
		{
			cacheLocation: cacheLocationOverride,
			ignoreCache,
			skipLanguageReports,
		},
	);

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

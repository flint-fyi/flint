import { readFromCache } from "../cache/readFromCache.ts";
import type { LinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import type { LintSession } from "./LintSession.ts";

export interface LintSessionWithCacheOptions {
	cacheLocation?: string | undefined;
	ignoreCache?: boolean | undefined;
	skipLanguageReports?: boolean | undefined;
}

export async function lintSessionWithCache(
	session: LintSession,
	configFilePath: string,
	host: LinterHost,
	{
		cacheLocation,
		ignoreCache,
		skipLanguageReports,
	}: LintSessionWithCacheOptions,
): Promise<LintResults> {
	const cached = ignoreCache
		? undefined
		: await readFromCache(
				host,
				session.allFilePaths,
				configFilePath,
				cacheLocation,
			);

	await session.lintFiles(
		cached
			? session.allFilePaths.difference(new Set(cached.keys()))
			: session.allFilePaths,
		{ skipLanguageReports: skipLanguageReports ?? false },
	);

	if (cached) {
		session.restoreCachedResults(cached);
	}

	return {
		allFilePaths: session.allFilePaths,
		allFileResults: new Map(session.storedResults),
		cached,
		ruleCount: session.ruleCount,
	};
}

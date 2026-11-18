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
		skipLanguageReports = false,
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

	if (cached) {
		session.restoreCachedResults(cached);

		const lintedResults = await session.lintChangedFiles(
			session.allFilePaths.difference(cached),
			{ skipLanguageReports },
		);
		for (const filePath of lintedResults.keys()) {
			cached.delete(filePath);
		}
	} else {
		await session.lintFiles(session.allFilePaths, { skipLanguageReports });
	}

	return {
		allFilePaths: session.allFilePaths,
		allFileResults: new Map(session.storedResults),
		cached,
		ruleCount: session.ruleCount,
	};
}

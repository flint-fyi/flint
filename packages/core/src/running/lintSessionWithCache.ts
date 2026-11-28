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
	const checkpoint = ignoreCache
		? undefined
		: await readFromCache(
				host,
				session.allFilePaths,
				configFilePath,
				cacheLocation,
			);

	if (checkpoint) {
		session.restoreCachedResults(checkpoint.files);
		await session.lintChangedFiles(checkpoint.changedFilePaths, {
			skipLanguageReports,
		});
	} else {
		await session.lintFiles(session.allFilePaths, { skipLanguageReports });
	}

	return session.getResults();
}

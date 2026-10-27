import { writeToCache } from "../cache/writeToCache.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { LintSession } from "./LintSession.ts";
import {
	lintSessionWithCache,
	type LintSessionWithCacheOptions,
} from "./lintSessionWithCache.ts";

export interface RunConfigOptions extends LintSessionWithCacheOptions {
	skipCacheWrite?: boolean;
}

export async function runConfig(
	configDefinition: ProcessedConfigDefinition,
	host: LinterHost,
	options: RunConfigOptions,
): Promise<LintResults> {
	const cacheLocation = options.cacheLocation || configDefinition.cacheLocation;

	using session = await LintSession.create(configDefinition, host);

	const lintResults = await lintSessionWithCache(
		session,
		configDefinition.filePath,
		host,
		{ ...options, cacheLocation },
	);

	if (!options.skipCacheWrite) {
		await writeToCache(
			host,
			configDefinition.filePath,
			lintResults,
			cacheLocation,
		);
	}

	return lintResults;
}

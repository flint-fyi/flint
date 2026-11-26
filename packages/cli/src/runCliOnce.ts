import { debugForFile } from "debug-for-file";

import {
	LintSession,
	type LinterHost,
	type LintResults,
} from "@flint.fyi/core";

import { loadConfigDefinition } from "./loadConfigDefinition.ts";
import type { OptionsValues } from "./options.ts";
import { renderCliResults } from "./renderCliResults.ts";
import type { Renderer } from "./renderers/types.ts";

const log = debugForFile(import.meta.url);

export interface CliResult {
	exitCode: number;
	lintResults: LintResults | undefined;
}

export async function runCliOnce(
	host: LinterHost,
	configFileName: string,
	renderer: Renderer,
	values: OptionsValues,
): Promise<CliResult> {
	const configDefinition = await loadConfigDefinition(host, configFileName);
	if (configDefinition === undefined) {
		return { exitCode: 2, lintResults: undefined };
	}

	log("Running with Flint in single-run mode with config: %s", configFileName);
	renderer.announce();

	const startTime = performance.now();

	const ignoreCache = values["cache-ignore"] ?? false;

	const skipLanguageReports = values["skip-language-reports"] ?? false;

	using session = await LintSession.create(configDefinition, host, {
		cacheLocation: values["cache-location"],
		ignoreCache,
	});
	const { allFileResults } = await session.lint({ skipLanguageReports });
	const changed = values.fix
		? (
				await session.fixFiles(allFileResults, {
					requestedSuggestions: new Set(values["fix-suggestions"]),
					skipLanguageReports,
				})
			).changed
		: undefined;
	await session.writeCache();
	const lintResults = { ...session.getResults(), ...(changed && { changed }) };

	const exitCode = await renderCliResults(host, lintResults, renderer, values, {
		ignoreCache,
		startTime,
	});

	return { exitCode, lintResults };
}

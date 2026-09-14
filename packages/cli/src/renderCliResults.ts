import type { LinterHost, LintResults } from "@flint.fyi/core";

import { runPrettier } from "./formatting/runPrettier.ts";
import type { OptionsValues } from "./options.ts";
import type { Renderer } from "./renderers/types.ts";

export interface RenderCliResultsOptions {
	formatFilePaths?: Iterable<string> | undefined;
	ignoreCache: boolean;
	startTime: number;
}

export async function renderCliResults(
	host: LinterHost,
	lintResults: LintResults,
	renderer: Renderer,
	values: OptionsValues,
	{ formatFilePaths, ignoreCache, startTime }: RenderCliResultsOptions,
): Promise<0 | 1> {
	const skipFormatting = values["skip-formatting"] ?? false;

	const formattingResults = skipFormatting
		? undefined
		: await runPrettier(host, lintResults, values.fix, formatFilePaths);

	const duration = performance.now() - startTime;

	await renderer.render({
		duration,
		formattingResults,
		ignoreCache,
		lintResults,
	});

	if (formattingResults?.dirty.size && !formattingResults.written) {
		return 1;
	}

	for (const fileResults of lintResults.allFileResults.values()) {
		if (fileResults.languageReports.length || fileResults.reports.length) {
			return 1;
		}
	}

	return 0;
}

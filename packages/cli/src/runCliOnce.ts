import { debugForFile } from "debug-for-file";

import { runConfig, runConfigFixing, type LinterHost } from "@flint.fyi/core";

import { loadConfigDefinition } from "./loadConfigDefinition.ts";
import type { OptionsValues } from "./options.ts";
import { renderCliResults } from "./renderCliResults.ts";
import type { Renderer } from "./renderers/types.ts";

const log = debugForFile(import.meta.filename);

export async function runCliOnce(
	host: LinterHost,
	configFileName: string,
	renderer: Renderer,
	values: OptionsValues,
) {
	const configDefinition = await loadConfigDefinition(host, configFileName);
	if (configDefinition == null) {
		return { exitCode: 2, lintResults: undefined };
	}

	log("Running with Flint in single-run mode with config: %s", configFileName);
	renderer.announce();

	const startTime = performance.now();

	const ignoreCache = values["cache-ignore"] ?? false;

	const skipLanguageReports = values["skip-language-reports"] ?? false;

	const lintResults = await (values.fix
		? runConfigFixing(configDefinition, host, {
				cacheLocation: values["cache-location"],
				ignoreCache,
				requestedSuggestions: new Set(values["fix-suggestions"]),
				skipLanguageReports,
			})
		: runConfig(configDefinition, host, {
				cacheLocation: values["cache-location"],
				ignoreCache,
				skipLanguageReports,
			}));

	return {
		exitCode: await renderCliResults(host, lintResults, renderer, values, {
			ignoreCache,
			startTime,
		}),
		lintResults,
	};
}

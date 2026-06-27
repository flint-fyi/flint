import path from "node:path";
import { pathToFileURL } from "node:url";

import { debugForFile } from "debug-for-file";

import {
	isConfig,
	runConfig,
	runConfigFixing,
	validateConfigDefinition,
	type FormattingResults,
	type LinterHost,
} from "@flint.fyi/core";

import { runPrettier } from "./formatting/runPrettier.ts";
import type { OptionsValues } from "./options.ts";
import type { Renderer } from "./renderers/types.ts";

const log = debugForFile(import.meta.filename);

export async function runCliOnce(
	host: LinterHost,
	configFileName: string,
	renderer: Renderer,
	values: OptionsValues,
) {
	const { default: config } = (await import(
		pathToFileURL(path.join(host.getCurrentDirectory(), configFileName)).href
	)) as {
		default: unknown;
	};

	if (!isConfig(config)) {
		console.error(
			`${configFileName} does not default export a Flint defineConfig value.`,
		);
		return { exitCode: 2, lintResults: undefined };
	}

	const validationError = validateConfigDefinition(
		config.definition,
		configFileName,
	);

	if (validationError) {
		console.error(validationError);
		return { exitCode: 2, lintResults: undefined };
	}

	log("Running with Flint in single-run mode with config: %s", configFileName);
	renderer.announce();

	const startTime = performance.now();

	const configDefinition = {
		...config.definition,
		filePath: configFileName,
	};
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

	const skipFormatting = values["skip-formatting"] ?? false;

	let formattingResults: FormattingResults | undefined;
	if (!skipFormatting) {
		formattingResults = await runPrettier(host, lintResults, values.fix);
	}

	const duration = performance.now() - startTime;

	await renderer.render({
		duration,
		formattingResults,
		ignoreCache,
		lintResults,
	});

	if (formattingResults?.dirty.size && !formattingResults.written) {
		return { exitCode: 1, lintResults };
	}

	for (const fileResults of lintResults.allFileResults.values()) {
		if (fileResults.languageReports.length || fileResults.reports.length) {
			return { exitCode: 1, lintResults };
		}
	}

	return { exitCode: 0, lintResults };
}

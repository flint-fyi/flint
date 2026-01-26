import {
	createDiskBackedLinterHost,
	createEphemeralLinterHost,
	isConfig,
	runConfig,
	runConfigFixing,
	validateConfigDefinition,
} from "@flint.fyi/core";
import { debugForFile } from "debug-for-file";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { runPrettier } from "./formatting/runPrettier.ts";
import type { OptionsValues } from "./options.ts";
import type { Renderer } from "./renderers/types.ts";

const log = debugForFile(import.meta.filename);

export async function runCliOnce(
	configFileName: string,
	renderer: Renderer,
	values: OptionsValues,
) {
	const { default: config } = (await import(
		pathToFileURL(path.join(process.cwd(), configFileName)).href
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

	const configDefinition = {
		...config.definition,
		filePath: configFileName,
	};
	const ignoreCache = !!values["cache-ignore"];

	const skipDiagnostics = !!values["skip-diagnostics"];

	const host = createEphemeralLinterHost(
		createDiskBackedLinterHost(process.cwd()),
	);

	const lintResults = await (values.fix
		? runConfigFixing(configDefinition, host, {
				ignoreCache,
				requestedSuggestions: new Set(values["fix-suggestions"]),
				skipDiagnostics,
			})
		: runConfig(configDefinition, host, { ignoreCache, skipDiagnostics }));

	// TODO: Eventually, it'd be nice to move everything fully in-memory.
	// This would be better for performance to avoid excess file system I/O.
	// https://github.com/flint-fyi/flint/issues/73
	const formattingResults = await runPrettier(lintResults, values.fix);

	await renderer.render({ formattingResults, ignoreCache, lintResults });

	if (formattingResults.dirty.size && !formattingResults.written) {
		return { exitCode: 1, lintResults };
	}

	for (const fileResults of lintResults.filesResults.values()) {
		if (fileResults.diagnostics.length || fileResults.reports.length) {
			return { exitCode: 1, lintResults };
		}
	}

	return { exitCode: 0, lintResults };
}

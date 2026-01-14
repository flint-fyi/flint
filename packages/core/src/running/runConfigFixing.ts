import { debugForFile } from "debug-for-file";

import { applyChangesToFiles } from "../changing/applyChangesToFiles.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LintResultsWithChanges } from "../types/linting.ts";
import { runConfig } from "./runConfig.ts";

const log = debugForFile(import.meta.filename);

const maximumIterations = 10;

export interface RunConfigFixingOptions {
	ignoreCache: boolean;
	requestedSuggestions: Set<string>;
	skipDiagnostics: boolean;
}

export async function runConfigFixing(
	configDefinition: ProcessedConfigDefinition,
	{
		ignoreCache,
		requestedSuggestions,
		skipDiagnostics,
	}: RunConfigFixingOptions,
): Promise<LintResultsWithChanges> {
	let changed = new Set<string>();
	let iteration = 0;

	while (true) {
		iteration += 1;
		log(
			"Starting fix iteration %d of maximum %d",
			iteration,
			maximumIterations,
		);

		// TODO: Investigate reusing file contents from previous iterations.
		// Why read file many time when few do trick?
		// Or, at least it should all be virtual...
		// https://github.com/flint-fyi/flint/issues/73
		const lintResults = await runConfig(configDefinition, {
			ignoreCache,
			skipDiagnostics,
		});

		log("Applying fixes from file results.");

		const fixedFilePaths = await applyChangesToFiles(
			lintResults.filesResults,
			requestedSuggestions,
		);

		log("Fixed %d files.", fixedFilePaths.length);

		if (!fixedFilePaths.length) {
			log("No file changes found, stopping.");
			return { ...lintResults, changed };
		}

		log("Applied changes to %d files.", fixedFilePaths.length);

		changed = changed.union(new Set(fixedFilePaths));

		if (iteration >= maximumIterations) {
			log("Passed maximum iterations of %d, halting.", maximumIterations);
			return { ...lintResults, changed };
		}
	}
}

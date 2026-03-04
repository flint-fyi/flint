import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";

import type { AnyLanguageFile } from "../types/languages.ts";
import type { FileReport } from "../types/reports.ts";
import type { AnyRule } from "../types/rules.ts";
import type {
	InferredInputObject,
	InferredOutputObject,
} from "../types/shapes.ts";
import { parseOptions } from "./parseOptions.ts";
import { processRuleReport } from "./processRuleReport.ts";
import type { LanguageFilesWithOptions } from "./types.ts";

const log = debugForFile(import.meta.filename);

export async function runLintRule(
	rule: AnyRule,
	filesAndOptions: LanguageFilesWithOptions[],
) {
	// 1. Set up the rule's runtime, which receives and processes reports

	const reportsByFilePath = new CachedFactory<string, FileReport[]>(() => []);
	let currentFile: AnyLanguageFile | undefined;

	const ruleRuntime = await rule.setup({
		report(ruleReport) {
			if (!currentFile) {
				throw new Error(
					"`filePath` not provided in a rule report() not called by a visitor.",
				);
			}

			const filePath = ruleReport.filePath ?? currentFile.about.filePath;

			log("Adding %s report for file path %s", ruleReport.message, filePath);

			reportsByFilePath
				.get(filePath)
				.push(processRuleReport(currentFile, rule, ruleReport));
		},
	});

	// 2. If the rule requested a runtime presence, ...

	if (ruleRuntime) {
		// 2a. If the rule has visitors, run them on every file to lint, with options
		if (ruleRuntime.visitors) {
			for (const { languageFiles, options } of filesAndOptions) {
				const parsedOptions: InferredOutputObject<(typeof rule)["options"]> =
					parseOptions(
						rule.options,
						// TODO: Figure out a way around the type assertion...
						options as InferredInputObject<(typeof rule)["options"]>,
					);

				for (const { file, language } of languageFiles) {
					currentFile = file;
					language.runFileVisitors(file, parsedOptions, ruleRuntime);
				}
			}
		}

		// 2b. If the rule has a teardown, run that after any visitors are done
		await ruleRuntime.teardown?.();
	}

	const reports = new Map(reportsByFilePath.entries());

	log("Found %d total reports for rule %s", reports.size, rule.about.id);

	return reports;
}

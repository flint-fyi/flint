import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";
import { AsyncLocalStorage } from "node:async_hooks";

import type { LinterHost } from "../types/host.ts";
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

const fileStorage = new AsyncLocalStorage<AnyLanguageFile>();

export async function runLintRule(
	rule: AnyRule,
	filesAndOptions: LanguageFilesWithOptions[],
	host: LinterHost,
) {
	// 1. Set up the rule's runtime, which receives and processes reports

	const reportsByFilePath = new CachedFactory<string, FileReport[]>(() => []);
	const fileByPath = new Map<string, AnyLanguageFile>();

	const ruleRuntime = await rule.setup({
		host,
		report(ruleReport) {
			const targetFile =
				ruleReport.filePath != null
					? fileByPath.get(ruleReport.filePath)
					: fileStorage.getStore();

			if (targetFile == null) {
				throw new Error(
					`Rule "${rule.about.id}" reported on file "${ruleReport.filePath}" which is not part of the current lint run.`,
				);
			}

			const processedReport = processRuleReport(targetFile, rule, ruleReport);
			if (processedReport == null) {
				return;
			}

			log(
				"Adding %s report for file path %s",
				ruleReport.message,
				targetFile.about.filePath,
			);

			reportsByFilePath.get(targetFile.about.filePath).push(processedReport);
		},
	});

	// 2. If the rule requested a runtime presence, ...

	for (const { languageFiles } of filesAndOptions) {
		for (const { file } of languageFiles) {
			fileByPath.set(file.about.filePath, file);
		}
	}

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
					fileStorage.run(file, () => {
						language.runFileVisitors(file, parsedOptions, ruleRuntime);
					});
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

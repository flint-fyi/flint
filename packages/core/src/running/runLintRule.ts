import { nullThrows } from "@flint.fyi/utils";
import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";

import type { AnyLanguageFile } from "../types/languages.ts";
import type { FileReport } from "../types/reports.ts";
import type { AnyRule } from "../types/rules.ts";
import type {
	InferredInputObject,
	InferredOutputObject,
} from "../types/shapes.ts";
import { getColumnAndLineOfPosition } from "../utils/getColumnAndLineOfPosition.ts";
import { parseOptions } from "./parseOptions.ts";
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
			// TODO: what if report is called asynchronously? maybe we can use AsyncLocalStorage?
			if (!currentFile) {
				throw new Error(
					"`filePath` not provided in a rule report() not called by a visitor.",
				);
			}

			const filePath = ruleReport.filePath ?? currentFile.about.filePath;

			log("Adding %s report for file path %s", ruleReport.message, filePath);

			let range = ruleReport.range;
			let fixes =
				ruleReport.fix && !Array.isArray(ruleReport.fix)
					? [ruleReport.fix]
					: ruleReport.fix;
			let suggestions = ruleReport.suggestions;

			const { adjustReportRange } = currentFile;
			if (adjustReportRange != null) {
				const r = adjustReportRange(ruleReport.range);
				if (r == null) {
					return;
				}
				range = r;
				fixes &&= fixes
					.map((fix) => {
						const range = adjustReportRange(fix.range);
						return (
							range && {
								...fix,
								range,
							}
						);
					})
					.filter((f) => f != null);

				suggestions &&= suggestions
					.map((s) => {
						if ("files" in s) {
							// TODO: support cross-file suggestions
							return null;
						}
						const range = adjustReportRange(s.range);
						return (
							range && {
								...s,
								range,
							}
						);
					})
					.filter((s) => s != null);
			}

			reportsByFilePath.get(filePath).push({
				...ruleReport,
				about: rule.about,
				fix: fixes,
				message: nullThrows(
					rule.messages[ruleReport.message],
					`Rule "${rule.about.id}" reported message "${ruleReport.message}" which is not defined in its messages.`,
				),
				range: {
					begin: getColumnAndLineOfPosition(
						currentFile.about.sourceText,
						range.begin,
					),
					end: getColumnAndLineOfPosition(
						currentFile.about.sourceText,
						range.end,
					),
				},
				suggestions,
			});
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

import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";

import type { LinterHost } from "../types/host.ts";
import type { LanguageBase, LanguageFile } from "../types/languages.ts";
import type { FileReport } from "../types/reports.ts";
import type { AnyRule, BoundRuleRuntime } from "../types/rules.ts";
import { processRuleReport } from "./processRuleReport.ts";
import type { LanguageAndFile } from "./types.ts";

const log = debugForFile(import.meta.url);

interface RuleState {
	optionsByFilePath: Map<string, object>;
	reportsByFilePath: CachedFactory<string, FileReport[]>;
	rule: AnyRule;
	runtime: BoundRuleRuntime | undefined;
}

interface VisitingRuleState {
	addFileVisitors: NonNullable<BoundRuleRuntime["addFileVisitors"]>;
	optionsByFilePath: Map<string, object>;
}

export async function runRules(
	languageFilesByFilePath: ReadonlyMap<string, LanguageAndFile[]>,
	rulesOptionsByFile: ReadonlyMap<AnyRule, Map<string, object>>,
	host: LinterHost,
): Promise<CachedFactory<string, FileReport[]>> {
	// 1. Collect every file being linted, for reports that name their file path
	const fileByPath = new Map<string, LanguageFile>();

	for (const languageAndFiles of languageFilesByFilePath.values()) {
		for (const { file } of languageAndFiles) {
			fileByPath.set(file.about.filePath, file);
		}
	}

	// 2. Set up each rule's runtime, which receives and processes its reports
	let currentFile: LanguageFile | undefined;

	const ruleStates = Array.from(
		rulesOptionsByFile,
		([rule, optionsByFilePath]): RuleState => ({
			optionsByFilePath,
			reportsByFilePath: new CachedFactory<string, FileReport[]>(() => []),
			rule,
			runtime: undefined,
		}),
	);

	await Promise.all(
		ruleStates.map(async (state) => {
			const { reportsByFilePath, rule } = state;

			state.runtime = await rule.setup({
				host,
				report(ruleReport) {
					const targetFile =
						ruleReport.filePath == null
							? currentFile
							: fileByPath.get(ruleReport.filePath);

					if (targetFile == null) {
						throw new Error(
							`Rule "${rule.about.id}" reported on file "${ruleReport.filePath}" which is not part of the current lint run.`,
						);
					}

					const processedReport = processRuleReport(
						targetFile,
						rule,
						ruleReport,
					);
					if (processedReport == null) {
						return;
					}

					log(
						"Adding %s report for file path %s",
						ruleReport.message,
						targetFile.about.filePath,
					);

					reportsByFilePath
						.get(targetFile.about.filePath)
						.push(processedReport);
				},
			});
		}),
	);

	// 3. Index rule states with visitors by language
	const statesByLanguage = new Map<LanguageBase, VisitingRuleState[]>();

	for (const state of ruleStates) {
		const addFileVisitors = state.runtime?.addFileVisitors;
		if (!addFileVisitors) {
			continue;
		}

		const statesForLanguage = statesByLanguage.get(state.rule.language);
		const visitingState: VisitingRuleState = {
			addFileVisitors,
			optionsByFilePath: state.optionsByFilePath,
		};

		if (statesForLanguage) {
			statesForLanguage.push(visitingState);
		} else {
			statesByLanguage.set(state.rule.language, [visitingState]);
		}
	}

	// 4. For each language under each file, run its rule visitors
	for (const [filePath, languageAndFiles] of languageFilesByFilePath) {
		for (const { file, language } of languageAndFiles) {
			const statesForLanguage = statesByLanguage.get(language);
			if (!statesForLanguage) {
				continue;
			}

			let ruleCount = 0;

			for (const { addFileVisitors, optionsByFilePath } of statesForLanguage) {
				const options = optionsByFilePath.get(filePath);
				if (options !== undefined) {
					addFileVisitors(file, options);
					ruleCount += 1;
				}
			}

			if (!ruleCount) {
				continue;
			}

			log("Running %d rules on file path %s", ruleCount, filePath);

			currentFile = file;
			file.runFileVisitors();
			currentFile = undefined;
		}
	}

	// 5. Run each rule's teardown, which may report on any file by path
	await Promise.all(
		ruleStates.map(async (state) => {
			await state.runtime?.teardown?.();
		}),
	);

	// 6. Join each rule's reports together, keeping rules in configuration order
	const reportsByFilePath = new CachedFactory<string, FileReport[]>(() => []);

	for (const state of ruleStates) {
		for (const [filePath, reports] of state.reportsByFilePath.entries()) {
			reportsByFilePath.get(filePath).push(...reports);
		}
	}

	return reportsByFilePath;
}

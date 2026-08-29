import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";

import type { LinterHost } from "../types/host.ts";
import type {
	AnyLanguage,
	AnyLanguageFile,
	FileVisitors,
} from "../types/languages.ts";
import type { FileReport } from "../types/reports.ts";
import type { AnyRule, RuleRuntime } from "../types/rules.ts";
import type {
	AnyOptionalSchema,
	InferredInputObject,
} from "../types/shapes.ts";
import { parseOptions } from "./parseOptions.ts";
import { processRuleReport } from "./processRuleReport.ts";
import type { LanguageAndFile } from "./types.ts";

const log = debugForFile(import.meta.filename);

interface RuleState {
	optionsByFilePath: Map<string, object>;
	parsedOptionsByOptions: Map<object, object | undefined>;
	reportsByFilePath: CachedFactory<string, FileReport[]>;
	rule: AnyRule;
	runtime: RuleRuntime<object, object> | undefined;
}

interface VisitingRuleState extends RuleState {
	visitors: object;
}

export async function runRules(
	languageFilesByFilePath: ReadonlyMap<string, LanguageAndFile[]>,
	rulesOptionsByFile: ReadonlyMap<AnyRule, Map<string, object>>,
	host: LinterHost,
): Promise<CachedFactory<string, FileReport[]>> {
	// 1. Collect every file being linted, for reports that name their file path
	const fileByPath = new Map<string, AnyLanguageFile>();

	for (const languageAndFiles of languageFilesByFilePath.values()) {
		for (const { file } of languageAndFiles) {
			fileByPath.set(file.about.filePath, file);
		}
	}

	// 2. Set up each rule's runtime, which receives and processes its reports
	let currentFile: AnyLanguageFile | undefined;

	const ruleStates = Array.from(
		rulesOptionsByFile,
		([rule, optionsByFilePath]): RuleState => ({
			optionsByFilePath,
			parsedOptionsByOptions: new Map(),
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

	// 3. Walk each file once, dispatching to the rules enabled on it
	const statesByLanguage = new Map<AnyLanguage, VisitingRuleState[]>();

	for (const state of ruleStates) {
		const { visitors } = state.runtime ?? {};
		if (!visitors) {
			continue;
		}

		const states = statesByLanguage.get(state.rule.language);
		const visitingState: VisitingRuleState = { ...state, visitors };

		if (states) {
			states.push(visitingState);
		} else {
			statesByLanguage.set(state.rule.language, [visitingState]);
		}
	}

	for (const [filePath, languageAndFiles] of languageFilesByFilePath) {
		for (const { file, language } of languageAndFiles) {
			const states = statesByLanguage.get(language);
			if (!states) {
				continue;
			}

			const fileVisitors = collectFileVisitors(states, file, filePath);
			if (!fileVisitors.length) {
				continue;
			}

			log("Running %d rules on file path %s", fileVisitors.length, filePath);

			currentFile = file;
			language.runFileVisitors(file, fileVisitors);
			currentFile = undefined;
		}
	}

	// 4. Run each rule's teardown, which may report on any file by path
	await Promise.all(
		ruleStates.map(async (state) => {
			await state.runtime?.teardown?.();
		}),
	);

	// 5. Join each rule's reports together, keeping rules in configuration order
	const reportsByFilePath = new CachedFactory<string, FileReport[]>(() => []);

	for (const state of ruleStates) {
		for (const [filePath, reports] of state.reportsByFilePath.entries()) {
			reportsByFilePath.get(filePath).push(...reports);
		}
	}

	return reportsByFilePath;
}

function collectFileVisitors(
	states: readonly VisitingRuleState[],
	file: AnyLanguageFile,
	filePath: string,
) {
	const fileVisitors: FileVisitors<object, object>[] = [];
	const servicesByParsedOptions = new CachedFactory<object | undefined, object>(
		(parsedOptions) => ({ options: parsedOptions, ...file.services }),
	);

	for (const state of states) {
		const options = state.optionsByFilePath.get(filePath);
		if (options === undefined) {
			continue;
		}

		const parsedOptions = getParsedOptions(state, options);

		fileVisitors.push({
			services: servicesByParsedOptions.get(parsedOptions),
			visitors: state.visitors,
		});
	}

	return fileVisitors;
}

function getParsedOptions(state: VisitingRuleState, options: object) {
	const { rule } = state;
	if (rule.options === undefined) {
		return undefined;
	}

	let parsedOptions = state.parsedOptionsByOptions.get(options);

	if (parsedOptions === undefined) {
		parsedOptions = parseOptions(
			rule.options,
			// TODO: Figure out a way around the type assertion...
			options as InferredInputObject<AnyOptionalSchema>,
		);
		state.parsedOptionsByOptions.set(options, parsedOptions);
	}

	return parsedOptions;
}

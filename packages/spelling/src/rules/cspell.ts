import type { Suggestion } from "@flint.fyi/core";
import { textLanguage } from "@flint.fyi/text-language";
import type { DocumentValidator } from "cspell-lib";
import { suggestionsForWord } from "cspell-lib";
import fs from "node:fs/promises";
import path from "node:path";

import {
	createDocumentValidator,
	getConfig,
} from "./createDocumentValidator.ts";
import { ruleCreator } from "./ruleCreator.ts";

interface FileTask {
	documentValidatorTask: Promise<DocumentValidator | undefined>;
	filePath: string;
	text: string;
}

function createIssueMessage(withReplacement?: boolean) {
	return {
		primary: 'Forbidden or unknown word: "{{ word }}".',
		secondary: [
			'The word "{{ word }}" is not in the project\'s dictionary (cspell.json).',
			"If it's intentional, add it to cspell.json under `words`.",
		],
		suggestions: [
			'Add "{{ word }}" to dictionary.',
			...(withReplacement
				? ['Replace with "{{ replacement }}" or another known word.']
				: []),
		],
	};
}

export default ruleCreator.createRule(textLanguage, {
	about: {
		description: "Runs the CSpell spell checker on any source code file.",
		id: "cspell",
		presets: ["logical"],
	},
	messages: {
		issue: createIssueMessage(),
		issueWithReplacement: createIssueMessage(true),
	},
	setup(context) {
		const fileTasks: FileTask[] = [];

		const cwd = process.cwd();
		const configPromise = getConfig(cwd);
		const cspellJsonPath = path.join(cwd, "cspell.json");
		const cspellJsonTextPromise = fs
			.readFile(cspellJsonPath, "utf8")
			.catch(() => undefined);

		return {
			dependencies: ["cspell.json"],
			teardown: async () => {
				const [config, cspellJsonText] = await Promise.all([
					configPromise,
					cspellJsonTextPromise,
				]);

				for (const { documentValidatorTask, filePath, text } of fileTasks) {
					const documentValidator = await documentValidatorTask;
					if (!documentValidator) {
						continue;
					}

					const issues = documentValidator.checkText(
						[0, text.length],
						undefined,
						undefined,
					);

					const finalizedSettings = documentValidator.getFinalizedDocSettings();

					for (const issue of issues) {
						const issueRange = {
							begin: issue.offset,
							end: issue.offset + (issue.length ?? issue.text.length),
						};

						const suggestionsResults = await suggestionsForWord(issue.text, {
							...finalizedSettings,
							numSuggestions: 1,
						});
						const firstSuggestion = suggestionsResults.suggestions[0];
						const isValidSuggestion =
							firstSuggestion &&
							!firstSuggestion.forbidden &&
							!firstSuggestion.noSuggest;

						const replacement = isValidSuggestion
							? (firstSuggestion.wordAdjustedToMatchCase ??
								firstSuggestion.word)
							: undefined;

						const data: Record<string, string> = {
							word: issue.text,
							...(replacement && { replacement }),
						};

						const words = config.words ?? [];
						const suggestions: Suggestion[] = [
							{
								files: {
									"cspell.json": words.includes(issue.text)
										? []
										: [
												{
													range: {
														begin: 0,
														end: cspellJsonText?.length ?? 0,
													},
													text:
														JSON.stringify(
															{
																...config,
																words: [...words, issue.text],
															},
															null,
															"\t",
														) + "\n",
												},
											],
								},
								id: "addWordToWords",
							},
						];

						context.report({
							data,
							filePath,
							message: replacement ? "issueWithReplacement" : "issue",
							range: issueRange,
							suggestions,
						});
					}
				}
			},
			visitors: {
				file: (text, { filePath, filePathAbsolute }) => {
					fileTasks.push({
						documentValidatorTask: (async () => {
							const config = await configPromise;

							return await createDocumentValidator(
								filePathAbsolute,
								text,
								config,
							);
						})(),
						filePath,
						text,
					});
				},
			},
		};
	},
});

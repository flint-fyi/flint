import type { Suggestion } from "@flint.fyi/core";
import { textLanguage } from "@flint.fyi/text-language";
import { parseJsonSafe } from "@flint.fyi/utils";
import type { DocumentValidator } from "cspell-lib";
import { suggestionsForWord } from "cspell-lib";

import { createDocumentValidator } from "./createDocumentValidator.ts";
import { ruleCreator } from "./ruleCreator.ts";

interface CSpellConfigLike {
	words?: string[];
}

interface FileTask {
	documentValidatorTask: Promise<DocumentValidator | undefined>;
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

		return {
			dependencies: ["cspell.json"],
			teardown: async () => {
				for (const { documentValidatorTask, text } of fileTasks) {
					const documentValidator = await documentValidatorTask;
					if (!documentValidator) {
						return undefined;
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

						const suggestions: Suggestion[] = [
							{
								files: {
									"cspell.json": (text) => {
										const original = parseJsonSafe(
											text,
										) as CSpellConfigLike | null;
										const words = original?.words ?? [];

										return words.includes(issue.text)
											? []
											: [
													{
														range: {
															begin: 0,
															end: text.length,
														},
														text: JSON.stringify({
															...original,
															words: [...words, issue.text],
														}),
													},
												];
									},
								},
								id: "addWordToWords",
							},
						];

						context.report({
							data,
							message: replacement ? "issueWithReplacement" : "issue",
							range: issueRange,
							suggestions,
						});
					}
				}
			},
			visitors: {
				file: (text, { filePathAbsolute }) => {
					fileTasks.push({
						documentValidatorTask: createDocumentValidator(
							filePathAbsolute,
							text,
						),
						text,
					});
				},
			},
		};
	},
});

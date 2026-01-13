import { textLanguage } from "@flint.fyi/text";
import { parseJsonSafe } from "@flint.fyi/utils";
import type { DocumentValidator } from "cspell-lib";

import { createDocumentValidator } from "./createDocumentValidator.ts";

interface CSpellConfigLike {
	words?: string[];
}

interface FileTask {
	documentValidatorTask: Promise<DocumentValidator | undefined>;
	text: string;
}

export default textLanguage.createRule({
	about: {
		description: "Runs the CSpell spell checker on any source code file.",
		id: "cspell",
		preset: "logical",
	},
	messages: {
		issue: {
			primary: 'Forbidden or unknown word: "{{ word }}".',
			secondary: [
				"The word '{{ word }}' is not in the project's dictionary (cspell.json).",
				"If this is a valid term, consider adding it to 'cspell.json' under 'words'.",
			],
			suggestions: [
				"Add '{{ word }}' to the project's dictionary.",
				// TODO: update this message when we've implemented "suggestions for typos":https://github.com/flint-fyi/flint/issues/1403
				"Correct the spelling if this was a typo.",
			],
		},
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

					for (const issue of issues) {
						context.report({
							data: {
								word: issue.text,
							},
							message: "issue",
							range: {
								begin: issue.offset,
								end: issue.offset + (issue.length ?? issue.text.length),
							},
							suggestions: [
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
							],
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

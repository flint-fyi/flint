import { camelCase, kebabCase, pascalCase, snakeCase } from "change-case";
import path from "node:path";
import { z } from "zod";

import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

type CaseName = "camelCase" | "kebabCase" | "pascalCase" | "snakeCase";

const caseFunctions: Record<CaseName, (value: string) => string> = {
	camelCase,
	kebabCase,
	pascalCase,
	snakeCase,
};

const caseDisplayNames: Record<CaseName, string> = {
	camelCase: "camel case",
	kebabCase: "kebab case",
	pascalCase: "pascal case",
	snakeCase: "snake case",
};

const casesSchema = z
	.object({
		camelCase: z.boolean().optional(),
		kebabCase: z.boolean().optional(),
		pascalCase: z.boolean().optional(),
		snakeCase: z.boolean().optional(),
	})
	.describe("Which case styles to allow. At least one should be true.");

const ignoredByDefault = new Set([
	"index.cjs",
	"index.js",
	"index.jsx",
	"index.mjs",
	"index.ts",
	"index.tsx",
]);

interface WordPart {
	ignored: boolean;
	word: string;
}

function englishJoinWords(words: string[]) {
	return new Intl.ListFormat("en-US", { type: "disjunction" }).format(words);
}

function getRenamedFilenames(
	leading: string,
	words: WordPart[],
	middle: string,
	extension: string,
	chosenCases: CaseName[],
): string[] {
	const caseConverters = chosenCases.map((name) => caseFunctions[name]);

	const replacements = words.map(({ ignored, word }) =>
		ignored ? [word] : caseConverters.map((converter) => converter(word)),
	);

	const combinations: string[][] = [[]];
	for (const options of replacements) {
		const newCombinations: string[][] = [];
		for (const existing of combinations) {
			for (const option of options) {
				newCombinations.push([...existing, option]);
			}
		}
		combinations.length = 0;
		combinations.push(...newCombinations);
	}

	const renames = new Set<string>();
	for (const parts of combinations) {
		renames.add(`${leading}${parts.join("")}${middle}${extension}`);
	}

	return [...renames];
}

function getWords(text: string): WordPart[] {
	const words: WordPart[] = [];

	let lastWord: undefined | WordPart;
	for (const char of text) {
		const isIgnored = isIgnoredChar(char);

		if (lastWord?.ignored === isIgnored) {
			lastWord.word += char;
		} else {
			lastWord = {
				ignored: isIgnored,
				word: char,
			};
			words.push(lastWord);
		}
	}

	return words;
}

function isIgnoredChar(char: string) {
	return !/^[\w-]$/iu.test(char);
}

function splitFilename(filename: string) {
	let leading = "";
	let index = 0;
	while (index < filename.length && filename[index] === "_") {
		leading += "_";
		index++;
	}
	const rest = filename.slice(index);
	return { leading, rest };
}

function validateFilename(words: WordPart[], chosenCases: CaseName[]): boolean {
	const caseConverters = chosenCases.map((name) => caseFunctions[name]);
	return words
		.filter(({ ignored }) => !ignored)
		.every(({ word }) =>
			caseConverters.some((converter) => converter(word) === word),
		);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports filenames that do not match a consistent casing.",
		id: "filenameCasing",
		presets: ["stylistic"],
	},
	messages: {
		invalidCase: {
			primary: "Filename `{{basename}}` does not match {{chosenCasesDisplay}}.",
			secondary: [
				"Consistent filename casing makes files easier to find and helps avoid cross-platform issues with case-sensitive file systems.",
			],
			suggestions: ["Rename to one of: {{renamedFilenames}}."],
		},
		invalidExtension: {
			primary: "File extension `{{extension}}` should be lowercase.",
			secondary: [
				"Uppercase file extensions are unconventional and can cause issues on case-sensitive file systems.",
			],
			suggestions: ["Rename to `{{basename}}`"],
		},
	},
	options: {
		cases: casesSchema.default({ kebabCase: true }),
		ignore: z
			.array(z.string())
			.default([])
			.describe("Regex patterns for filenames to ignore."),
		multipleFileExtensions: z
			.boolean()
			.default(true)
			.describe(
				"Whether to treat parts after the first `.` as extensions (e.g., `.test.ts`).",
			),
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (node, { options }) => {
					const fileName = node.fileName;
					const basename = path.basename(fileName);
					const extension = path.extname(basename);
					const filenameWithoutExtension = path.basename(basename, extension);

					if (ignoredByDefault.has(basename)) {
						return;
					}

					for (const pattern of options.ignore) {
						if (new RegExp(pattern, "u").test(basename)) {
							return;
						}
					}

					if (extension && extension !== extension.toLowerCase()) {
						context.report({
							data: {
								basename: filenameWithoutExtension + extension.toLowerCase(),
								extension,
							},
							message: "invalidExtension",
							range: { begin: 0, end: 0 },
						});
						return;
					}

					let filename: string;
					let middle: string;

					if (options.multipleFileExtensions) {
						const firstDot = filenameWithoutExtension.indexOf(".");
						if (firstDot === -1) {
							filename = filenameWithoutExtension;
							middle = "";
						} else {
							filename = filenameWithoutExtension.slice(0, firstDot);
							middle = filenameWithoutExtension.slice(firstDot);
						}
					} else {
						filename = filenameWithoutExtension;
						middle = "";
					}

					const chosenCases = (
						Object.entries(options.cases) as [CaseName, boolean | undefined][]
					)
						.filter(([, enabled]) => enabled)
						.map(([name]) => name);

					if (chosenCases.length === 0) {
						chosenCases.push("kebabCase");
					}

					const { leading, rest } = splitFilename(filename);
					const words = getWords(rest);

					if (validateFilename(words, chosenCases)) {
						return;
					}

					const renamedFilenames = getRenamedFilenames(
						leading,
						words,
						middle,
						extension,
						chosenCases,
					);

					const chosenCasesDisplay = englishJoinWords(
						chosenCases.map((name) => caseDisplayNames[name]),
					);

					context.report({
						data: {
							basename,
							chosenCasesDisplay,
							renamedFilenames: renamedFilenames
								.slice(0, 3)
								.map((name) => `\`${name}\``)
								.join(", "),
						},
						message: "invalidCase",
						range: { begin: 0, end: 0 },
					});
				},
			},
		};
	},
});

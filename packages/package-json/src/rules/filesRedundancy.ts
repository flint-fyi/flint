import {
	getJsonNodeRange,
	jsonLanguage,
	type JsonSourceFile,
} from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { getPackagePropertyOfName } from "../getPackagePropertyOfName.ts";
import { removeArrayElement } from "../removeArrayElement.ts";
import { ruleCreator } from "../ruleCreator.ts";

const defaultFiles = [
	/* cspell:disable-next-line */
	///^(\.\/)?LICEN(C|S)E(\.|$)/i,
	/^(\.\/)?README(\.|$)/i,
	/^(\.\/)?package\.json$/i,
];

const wildcardsRegex = /[*?[\]{}]/;

const cachedRegex = new Map<string, RegExp>();
const getCachedLocalFileRegex = (filename: string) => {
	if (wildcardsRegex.test(filename)) {
		return null;
	}

	// Strip the leading `./`, if there is one, since we'll be incorporating
	// it into the regex.
	const baseFilename = filename.replace("./", "");
	let regex = cachedRegex.get(baseFilename);
	if (regex) {
		return regex;
	} else {
		regex = new RegExp(`^(./)?${baseFilename}$`, "i");
		cachedRegex.set(baseFilename, regex);
		return regex;
	}
};

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description: "Prevents adding unnecessary / redundant files.",
		id: "filesRedundancy",
		presets: ["logical"],
	},
	messages: {
		duplicate: {
			primary: '`files` has more than one entry for "{{file}}".',
			secondary: [
				"Multiple entries for the same file in the `files` array are redundant and may indicate a mistake or outdated configuration.",
			],
			suggestions: ["Remove this redundant entry."],
		},
		unnecessaryBin: {
			primary: `Explicitly declaring "{{file}}" in \`files\` is unnecessary; it's included in \`bin\`.`,
			secondary: [
				"Files that are included in the `bin` field of a package.json are automatically included when the package is published, so there's no need to also list them in the `files` array.",
			],
			suggestions: ["Remove this unnecessary entry."],
		},
		unnecessaryDefault: {
			primary: `Explicitly declaring "{{file}}" in \`files\` is unnecessary; it's included by default.`,
			secondary: [
				"npm includes certain files by default when publishing a package, such as `README.md`, `CHANGELOG.md`, `LICENSE`, and `LICENCE`. Explicitly listing these files in the `files` array is redundant and may indicate a misunderstanding of npm's default behavior.",
			],
			suggestions: ["Remove this unnecessary entry."],
		},
		unnecessaryMain: {
			primary: `Explicitly declaring "{{file}}" in \`files\` is unnecessary; it's the \`main\` entry.`,
			secondary: [
				"Files that are configured as the `main` entry of a package.json are automatically included when the package is published, so there's no need to also list them in the `files` array.",
			],
			suggestions: ["Remove this unnecessary entry."],
		},
	},
	setup(context) {
		const report = (
			sourceFile: JsonSourceFile,
			element: AST.StringLiteral,
			arrayNode: AST.ArrayLiteralExpression,
			message:
				| "duplicate"
				| "unnecessaryBin"
				| "unnecessaryDefault"
				| "unnecessaryMain",
		) => {
			const { range, text } = removeArrayElement(
				sourceFile,
				element,
				arrayNode,
			);

			context.report({
				data: { file: element.text },
				message,
				range: getJsonNodeRange(element, sourceFile),
				suggestions: [
					{
						id: "removeDuplicateFile",
						range,
						text,
					},
				],
			});
		};

		return {
			visitors: {
				JsonSourceFile(node, { sourceFile }) {
					let mainFile: null | string = null;
					const binFiles: string[] = [];

					// Get the `files` property first, and bail early if it doesn't exist or isn't the right shape
					const files = getPackagePropertyOfName(node, "files");
					if (
						files?.kind !== SyntaxKind.PropertyAssignment ||
						files.initializer.kind !== SyntaxKind.ArrayLiteralExpression
					) {
						return;
					}

					// main should always be a string
					const main = getPackagePropertyOfName(node, "main");
					if (main?.kind === SyntaxKind.PropertyAssignment) {
						if (main.initializer.kind === SyntaxKind.StringLiteral) {
							mainFile = main.initializer.text;
						}
					}

					// bin can be a string or an object with string values
					const bin = getPackagePropertyOfName(node, "bin");
					if (bin?.kind === SyntaxKind.PropertyAssignment) {
						if (bin.initializer.kind === SyntaxKind.StringLiteral) {
							binFiles.push(bin.initializer.text);
						} else if (
							bin.initializer.kind === SyntaxKind.ObjectLiteralExpression
						) {
							for (const property of bin.initializer.properties) {
								if (
									property.kind === SyntaxKind.PropertyAssignment &&
									property.initializer.kind === SyntaxKind.StringLiteral
								) {
									binFiles.push(property.initializer.text);
								}
							}
						}
					}

					const seenFiles = new Set<string>();
					for (const element of files.initializer.elements) {
						if (element.kind === SyntaxKind.StringLiteral) {
							// Check for duplicates
							if (seenFiles.has(element.text)) {
								report(sourceFile, element, files.initializer, "duplicate");
							} else {
								seenFiles.add(element.text);
							}

							const fileRegex = getCachedLocalFileRegex(element.text);

							// See if the file is included in `bin`
							if (binFiles.some((binFile) => fileRegex?.test(binFile))) {
								report(
									sourceFile,
									element,
									files.initializer,
									"unnecessaryBin",
								);
							}

							// See if the file is the `main` entry
							if (mainFile && fileRegex?.test(mainFile)) {
								report(
									sourceFile,
									element,
									files.initializer,
									"unnecessaryMain",
								);
							}

							// See if the file is one of npm's default included files
							if (
								defaultFiles.some((defaultFile) =>
									defaultFile.test(element.text),
								)
							) {
								report(
									sourceFile,
									element,
									files.initializer,
									"unnecessaryDefault",
								);
							}
						}
					}
				},
			},
		};
	},
});

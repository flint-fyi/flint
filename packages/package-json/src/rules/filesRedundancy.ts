// cspell:ignore LICENCE

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

// Based on https://github.com/npm/npm-packlist/blob/bd54f71a526e77ba7db9671980ee00388f76a5aa/lib/index.js#L272-L290
const defaultFilePatterns = [
	/^(\.\/)?package\.json$/,
	/^(\.\/)?readme($|\.[^/]*[^/~$]$)/i,
	/^(\.\/)?copying($|\.[^/]*[^/~$]$)/i,
	/^(\.\/)?license($|\.[^/]*[^/~$]$)/i,
	/^(\.\/)?licence($|\.[^/]*[^/~$]$)/i,
];

const wildcardsRegex = /[*?[\]{}]/;
const cachedRegexes = new Map<string, RegExp>();

type FilesRedundancyMessage =
	| "redundantBin"
	| "redundantDefault"
	| "redundantDuplicate"
	| "redundantMain";

function getBinFiles(node: JsonSourceFile) {
	const property = getPackagePropertyOfName(node, "bin");
	if (property?.kind !== SyntaxKind.PropertyAssignment) {
		return [];
	}

	const initializer = property.initializer;
	if (initializer.kind === SyntaxKind.StringLiteral) {
		return [initializer.text];
	}

	if (initializer.kind !== SyntaxKind.ObjectLiteralExpression) {
		return [];
	}

	return initializer.properties.flatMap((binProperty) => {
		if (
			binProperty.kind !== SyntaxKind.PropertyAssignment ||
			binProperty.initializer.kind !== SyntaxKind.StringLiteral
		) {
			return [];
		}

		return [binProperty.initializer.text];
	});
}

function getCachedLocalFileRegex(fileName: string) {
	if (wildcardsRegex.test(fileName)) {
		return undefined;
	}

	const baseFileName = fileName.replace("./", "");
	const cachedRegex = cachedRegexes.get(baseFileName);
	if (cachedRegex) {
		return cachedRegex;
	}

	const regex = new RegExp(`^(\\.\\/)?${RegExp.escape(baseFileName)}$`, "i");
	cachedRegexes.set(baseFileName, regex);
	return regex;
}

function getPackageStringProperty(node: JsonSourceFile, propertyName: string) {
	const property = getPackagePropertyOfName(node, propertyName);
	if (
		property?.kind !== SyntaxKind.PropertyAssignment ||
		property.initializer.kind !== SyntaxKind.StringLiteral
	) {
		return undefined;
	}

	return property.initializer.text;
}

export default ruleCreator.createRule(jsonLanguage, {
	about: {
		description:
			"Reports package.json `files` entries that npm already includes.",
		id: "filesRedundancy",
		presets: ["logical"],
	},
	messages: {
		redundantBin: {
			primary:
				'Declaring "{{ file }}" in `files` is unnecessary; it is already included via `bin`.',
			secondary: [
				"Files declared in `bin` are always included in the published package, regardless of `files`.",
			],
			suggestions: ["Remove the redundant entry."],
		},
		redundantDefault: {
			primary:
				'Declaring "{{ file }}" in `files` is unnecessary; it is included by default.',
			secondary: [
				"`package.json`, README, COPYING, LICENSE, and LICENCE root files are always included in the published package.",
			],
			suggestions: ["Remove the redundant entry."],
		},
		redundantDuplicate: {
			primary: '`files` has more than one entry for "{{ file }}".',
			secondary: ["Each file pattern only needs to appear once in `files`."],
			suggestions: ["Remove the duplicate entry."],
		},
		redundantMain: {
			primary:
				'Declaring "{{ file }}" in `files` is unnecessary; it is already the `main` entry.',
			secondary: [
				"The file declared in `main` is always included in the published package, regardless of `files`.",
			],
			suggestions: ["Remove the redundant entry."],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsonSourceFile(node, { sourceFile }) {
					const filesProperty = getPackagePropertyOfName(node, "files");
					if (
						filesProperty?.kind !== SyntaxKind.PropertyAssignment ||
						filesProperty.initializer.kind !== SyntaxKind.ArrayLiteralExpression
					) {
						return;
					}

					const filesArray = filesProperty.initializer;
					const mainFile = getPackageStringProperty(node, "main");
					const binFiles = getBinFiles(node);
					const seenFiles = new Set<string>();

					function reportEntry(
						element: AST.StringLiteral,
						message: FilesRedundancyMessage,
					) {
						const { range, text } = removeArrayElement(
							sourceFile,
							element,
							filesArray,
						);

						context.report({
							data: {
								file: element.text,
							},
							message,
							range: getJsonNodeRange(element, sourceFile),
							suggestions: [
								{
									id: "removeFilesEntry",
									range,
									text,
								},
							],
						});
					}

					for (const element of filesArray.elements) {
						if (element.kind !== SyntaxKind.StringLiteral) {
							continue;
						}

						const value = element.text;

						if (seenFiles.has(value)) {
							reportEntry(element, "redundantDuplicate");
							continue;
						}

						seenFiles.add(value);

						if (defaultFilePatterns.some((pattern) => pattern.test(value))) {
							reportEntry(element, "redundantDefault");
							continue;
						}

						const filesEntryRegex = getCachedLocalFileRegex(value);

						if (!filesEntryRegex) {
							continue;
						}

						if (mainFile && filesEntryRegex.test(mainFile)) {
							reportEntry(element, "redundantMain");
							continue;
						}

						if (binFiles.some((binFile) => filesEntryRegex.test(binFile))) {
							reportEntry(element, "redundantBin");
						}
					}
				},
			},
		};
	},
});

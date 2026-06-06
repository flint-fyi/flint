// cspell:ignore LICENCE

import type { ElementNode, MemberNode } from "@humanwhocodes/momoa";

import { getJsonNodeRange, jsonLanguage } from "@flint.fyi/json-language/new";

import { getPackagePropertiesOfNames } from "../getPackagePropertiesOfNames.ts";
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
const packagePropertyNames = ["bin", "files", "main"];

type FilesRedundancyMessage =
	| "redundantBin"
	| "redundantDefault"
	| "redundantDuplicate"
	| "redundantMain";

function getBinFiles(property: MemberNode | undefined) {
	if (!property) {
		return [];
	}

	const value = property.value;
	if (value.type === "String") {
		return [value.value];
	}

	if (value.type !== "Object") {
		return [];
	}

	return value.members.flatMap((binProperty) => {
		if (binProperty.value.type !== "String") {
			return [];
		}

		return [binProperty.value.value];
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

	// TODO[typescript>=6.0]: Use RegExp.escape once TypeScript includes its types.
	const escapedBaseFileName = baseFileName.replace(
		/[\\^$.*+?()[\]{}|]/g,
		"\\$&",
	);
	const regex = new RegExp(`^(\\.\\/)?${escapedBaseFileName}$`, "i");
	cachedRegexes.set(baseFileName, regex);
	return regex;
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
				Document(node) {
					const properties = getPackagePropertiesOfNames(
						node,
						packagePropertyNames,
					);
					const filesProperty = properties.files;
					if (filesProperty?.value.type !== "Array") {
						return;
					}

					const filesArray = filesProperty.value;
					const mainFile =
						properties.main?.value.type === "String"
							? properties.main.value.value
							: undefined;
					const binFiles = getBinFiles(properties.bin);
					const seenFiles = new Set<string>();

					function reportEntry(
						element: ElementNode,
						file: string,
						message: FilesRedundancyMessage,
					) {
						const { range, text } = removeArrayElement(element, filesArray);

						context.report({
							data: { file },
							message,
							range: getJsonNodeRange(element.value),
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
						if (element.value.type !== "String") {
							continue;
						}

						const value = element.value.value;

						if (seenFiles.has(value)) {
							reportEntry(element, value, "redundantDuplicate");
							continue;
						}

						seenFiles.add(value);

						if (defaultFilePatterns.some((pattern) => pattern.test(value))) {
							reportEntry(element, value, "redundantDefault");
							continue;
						}

						const filesEntryRegex = getCachedLocalFileRegex(value);

						if (!filesEntryRegex) {
							continue;
						}

						if (mainFile && filesEntryRegex.test(mainFile)) {
							reportEntry(element, value, "redundantMain");
							continue;
						}

						if (binFiles.some((binFile) => filesEntryRegex.test(binFile))) {
							reportEntry(element, value, "redundantBin");
						}
					}
				},
			},
		};
	},
});

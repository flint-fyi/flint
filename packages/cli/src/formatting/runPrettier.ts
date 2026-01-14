import type {
	FormattingResults,
	LintResultsMaybeWithChanges,
} from "@flint.fyi/core";
import { debugForFile } from "debug-for-file";
import * as fs from "node:fs/promises";
import * as prettier from "prettier";

const log = debugForFile(import.meta.filename);

export async function runPrettier(
	lintResults: LintResultsMaybeWithChanges,
	fix: boolean | undefined,
) {
	const allFilePaths = new Set([
		...(lintResults.changed ?? []),
		...lintResults.allFilePaths,
	]);
	log("Running Prettier on %d file(s)", allFilePaths.size);

	const formattingResults: FormattingResults = {
		clean: new Set<string>(),
		dirty: new Set<string>(),
		written: !!fix,
	};

	// This is probably very slow for having lots of lookups and async calls.
	// Eventually we should investigate faster APIs.
	// https://github.com/prettier/prettier/issues/17422
	await Promise.all(
		Array.from(allFilePaths).map(async (filePath) => {
			// TODO: This duplicates the reading of files in languages themselves.
			// It should eventually be merged into the language file factories,
			// likely providing the result of reading the file to the factories.
			// See investigation work around unifying TypeScript's file systems:
			// https://github.com/flint-fyi/flint/issues/73
			const originalFileContent = await fs.readFile(filePath, "utf8");

			const updatedFileContent = await prettier.format(originalFileContent, {
				filepath: filePath,
				...(await prettier.resolveConfig(filePath)),
			});

			if (originalFileContent === updatedFileContent) {
				formattingResults.clean.add(filePath);
				log("No formatting changes for file: %s", filePath);
				return;
			}

			formattingResults.dirty.add(filePath);

			if (fix) {
				// TODO: Eventually, the file system should be abstracted
				// Direct fs write calls don't make sense in e.g. virtual file systems
				// https://github.com/flint-fyi/flint/issues/73
				await fs.writeFile(filePath, updatedFileContent);
			}

			log("Formatted file: %s", filePath);
		}),
	);

	log(
		"Found %d correctly formatted file(s) and %d incorrectly formatted files",
		formattingResults.clean.size,
		formattingResults.dirty.size,
	);

	return formattingResults;
}

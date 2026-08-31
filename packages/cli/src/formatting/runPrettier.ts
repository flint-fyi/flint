import path from "node:path";

import { debugForFile } from "debug-for-file";
import ignore from "ignore";
import * as prettier from "prettier";

import type {
	FormattingResults,
	LinterHost,
	LintResultsMaybeWithChanges,
} from "@flint.fyi/core";

const log = debugForFile(import.meta.filename);

export async function runPrettier(
	host: LinterHost,
	lintResults: LintResultsMaybeWithChanges,
	fix: boolean | undefined,
): Promise<FormattingResults> {
	const allFilePaths = new Set([
		...(lintResults.changed ?? []),
		...lintResults.allFilePaths,
	]);
	log("Running Prettier on %d file(s)", allFilePaths.size);
	const currentDirectory = host.getCurrentDirectory();
	const prettierIgnore = ignore({ allowRelativePaths: true }).add(
		`${(await host.readFile(path.posix.join(currentDirectory, ".prettierignore"))) ?? ""}\nnode_modules`,
	);

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
			if (
				prettierIgnore.checkIgnore(
					path.posix.relative(currentDirectory, filePath),
				).ignored
			) {
				log("Skipping ignored file: %s", filePath);
				return;
			}

			// TODO: This duplicates the reading of files in languages themselves.
			const originalFileContent = await host.readFile(filePath);

			if (originalFileContent === undefined) {
				log("Skipping missing file: %s", filePath);
				return;
			}

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
				await host.writeFile(filePath, updatedFileContent);
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

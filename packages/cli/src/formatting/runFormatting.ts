import { debugForFile } from "debug-for-file";
import { resolveFormatter } from "formatly";

import type {
	FormattingResults,
	LinterHost,
	LintResultsMaybeWithChanges,
} from "@flint.fyi/core";

const log = debugForFile(import.meta.url);

export async function runFormatting(
	host: LinterHost,
	lintResults: LintResultsMaybeWithChanges,
	fix: boolean | undefined,
): Promise<FormattingResults | undefined> {
	const configRoot = host.getRepositoryRoot() ?? host.getCurrentDirectory();
	const formatter = await resolveFormatter(configRoot);

	if (!formatter) {
		log("Skipping formatting: no formatter detected in %s", configRoot);
		return undefined;
	}

	const allFilePaths = new Set([
		...(lintResults.changed ?? []),
		...lintResults.allFilePaths,
	]);
	log("Running %s on %d file(s)", formatter.name, allFilePaths.size);

	const formattingResults: FormattingResults = {
		clean: new Set<string>(),
		dirty: new Set<string>(),
		written: !!fix,
	};

	await Promise.all(
		Array.from(allFilePaths).map(async (filePath) => {
			// TODO: This duplicates the reading of files in languages themselves.
			const originalFileContent = await host.readFile(filePath);

			if (originalFileContent === undefined) {
				log("Skipping missing file: %s", filePath);
				return;
			}

			const result = await formatter.formatText({
				cwd: configRoot,
				filePath,
				text: originalFileContent,
			});

			if (result.error) {
				throw result.error;
			}

			if (originalFileContent === result.formatted) {
				formattingResults.clean.add(filePath);
				log("No formatting changes for file: %s", filePath);
				return;
			}

			formattingResults.dirty.add(filePath);

			if (fix) {
				await host.writeFile(filePath, result.formatted);
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

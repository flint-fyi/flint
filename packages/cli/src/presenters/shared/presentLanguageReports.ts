import type { FileResults } from "@flint.fyi/core";
import chalk from "chalk";

import { pluralize } from "../pluralize.ts";

export function* presentLanguageReports(
	filesResults: Map<string, FileResults>,
) {
	const languageReports = Array.from(filesResults.values()).flatMap(
		(fileResults) => fileResults.languageReports,
	);
	if (!languageReports.length) {
		return;
	}

	yield "\n";
	yield chalk.yellow(
		`⚠️  Additionally found ${pluralize(languageReports.length, "language reports")}:`,
	);
	yield "\n\n";

	for (const languageReport of languageReports) {
		yield languageReport.text;
		yield "\n";
	}

	yield "\n";
}

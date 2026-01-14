import chalk from "chalk";

import { pluralize } from "../pluralize.ts";
import type { PresenterSummarizeContext } from "../types.ts";

export interface SummaryCounts {
	all: number;
	files: number;
	fixable: number;
}

export function* presentSummary(
	counts: SummaryCounts,
	{ formattingResults, lintResults }: PresenterSummarizeContext,
) {
	if (lintResults.changed?.size) {
		yield chalk.green(
			[
				"✔ Fixed ",
				chalk.bold(pluralize(lintResults.changed.size, "file")),
				" automatically (--fix).\n\n",
			].join(""),
		);
	}

	if (counts.all === 0) {
		yield chalk.green("No linting issues found.\n");
	} else {
		yield "\n";
		yield chalk.red(
			[
				"\u2716 Found ",
				chalk.bold(pluralize(counts.all, "report")),
				" across ",
				chalk.bold(pluralize(counts.files, "file")),
				...(counts.fixable
					? [
							" (",
							chalk.bold(pluralize(counts.fixable, "fixable with --fix")),
							")",
						]
					: []),
				".\n",
			].join(""),
		);
	}

	if (formattingResults.dirty.size) {
		yield "\n";

		if (formattingResults.written) {
			yield chalk.blue(
				[
					"✳ Cleaned ",
					chalk.bold(pluralize(formattingResults.dirty.size, "file")),
					"'s formatting with Prettier (--fix):\n",
				].join(""),
			);
		} else {
			yield chalk.blue(
				[
					"✳ Found ",
					chalk.bold(pluralize(formattingResults.dirty.size, "file")),
					" with Prettier formatting differences (add ",
					chalk.bold("--fix"),
					" to rewrite):\n",
				].join(""),
			);
		}

		for (const dirtyFile of formattingResults.dirty) {
			yield `  ${chalk.gray(dirtyFile)}\n`;
		}
	}
}

import { styleText } from "node:util";

import { pluralize } from "../pluralize.ts";
import type { PresenterSummarizeContext } from "../types.ts";

export interface SummaryCounts {
	all: number;
	files: number;
	fixable: number;
}

export function* presentSummary(
	counts: SummaryCounts,
	{ duration, formattingResults, lintResults }: PresenterSummarizeContext,
): Generator<string, void, void> {
	if (lintResults.changed?.size) {
		yield styleText(
			"green",
			[
				"✔ Fixed ",
				styleText("bold", pluralize(lintResults.changed.size, "file")),
				" automatically (--fix).\n\n",
			].join(""),
		);
	}

	if (counts.all === 0) {
		yield styleText("green", "No linting issues found.\n");
	} else {
		yield "\n";
		yield styleText(
			"red",
			[
				"\u{2716} Found ",
				styleText("bold", pluralize(counts.all, "report")),
				" across ",
				styleText("bold", pluralize(counts.files, "file")),
				...(counts.fixable
					? [
							" (",
							styleText("bold", `${counts.fixable} fixable with --fix`),
							")",
						]
					: []),
				".\n",
			].join(""),
		);
	}

	if (formattingResults?.dirty.size) {
		yield "\n";

		if (formattingResults.written) {
			yield styleText(
				"blue",
				[
					"✳ Cleaned ",
					styleText("bold", pluralize(formattingResults.dirty.size, "file")),
					"'s formatting with Prettier (--fix):\n",
				].join(""),
			);
		} else {
			yield styleText(
				"blue",
				[
					"✳ Found ",
					styleText("bold", pluralize(formattingResults.dirty.size, "file")),
					" with Prettier formatting differences (add ",
					styleText("bold", "--fix"),
					" to rewrite):\n",
				].join(""),
			);
		}

		for (const dirtyFile of formattingResults.dirty) {
			yield `  ${styleText("gray", dirtyFile)}\n`;
		}
	}

	yield "\n";
	yield styleText(
		"gray",
		`Finished in ${formatDuration(duration)} on ${pluralize(lintResults.allFilePaths.size, "file")} with ${pluralize(lintResults.ruleCount, "rule")}.\n`,
	);
}

function formatDuration(ms: number) {
	return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

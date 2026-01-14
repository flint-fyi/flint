import { hasFix } from "@flint.fyi/core";
import chalk from "chalk";

import { presentHeader } from "../shared/header.ts";
import { presentDiagnostics } from "../shared/presentDiagnostics.ts";
import { presentSummary } from "../shared/summary.ts";
import type { PresenterFactory } from "../types.ts";
import { ColorCodes, indenter } from "./constants.ts";
import { createDetailedReport } from "./createDetailedReport.ts";
import { wrapIfNeeded } from "./wrapIfNeeded.ts";

export const detailedPresenterFactory: PresenterFactory = {
	about: {
		name: "detailed",
	},
	initialize(context) {
		const counts = { all: 0, files: 0, fixable: 0 };

		return {
			header: Array.from(presentHeader(context)),
			async *renderFile({ file, reports }) {
				counts.all += reports.length;
				counts.files += 1;
				counts.fixable += reports.filter(hasFix).length;

				const width = process.stdout.columns - indenter.length;

				yield chalk.gray("╭");
				yield chalk.hex(ColorCodes.filePathPrefix)("./");
				yield* wrapIfNeeded(
					chalk.bold.hex(ColorCodes.filePath),
					file.filePath,
					width,
				);

				let widest = 16;

				for (const report of reports) {
					yield `\n${indenter}\n`;
					yield* createDetailedReport(report, file.text, width);

					widest = Math.max(
						widest,
						...[
							report.message.primary,
							...report.message.suggestions,
							...report.message.secondary,
						].map((suggestion) => suggestion.length + 3),
					);
				}

				yield `\n${indenter}\n`;
				yield chalk.gray(`╰${"─".repeat(Math.min(widest, width))}`);
				yield "\n";
			},
			*summarize(summaryContext) {
				yield* presentSummary(counts, summaryContext);
				yield* presentDiagnostics(summaryContext.lintResults.filesResults);
			},
		};
	},
};

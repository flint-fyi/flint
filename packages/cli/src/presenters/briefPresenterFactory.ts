import { formatReport, hasFix } from "@flint.fyi/core";
import { makeAbsolute } from "@flint.fyi/utils";
import { styleText } from "node:util";
import { textTable } from "text-table-fast";

import { presentHeader } from "./shared/header.ts";
import { presentDiagnostics } from "./shared/presentDiagnostics.ts";
import { presentSummary } from "./shared/summary.ts";
import type { PresenterFactory } from "./types.ts";

export const briefPresenterFactory: PresenterFactory = {
	about: {
		name: "brief",
	},
	initialize(initializeContext) {
		const counts = { all: 0, files: 0, fixable: 0 };

		return {
			header: Array.from(presentHeader(initializeContext)),
			*renderFile({ file, reports }) {
				counts.all += reports.length;
				counts.files += 1;
				counts.fixable += reports.filter(hasFix).length;

				yield "\n";
				yield styleText("underline", makeAbsolute(file.filePath));
				yield "\n";

				yield textTable(
					reports
						.toSorted((a, b) =>
							a.range.begin.line === b.range.begin.line
								? a.range.begin.column - b.range.begin.column
								: a.range.begin.line - b.range.begin.line,
						)
						.map((report) => [
							styleText(
								"gray",
								`  ${report.range.begin.line + 1}:${report.range.begin.column + 1}`,
							),
							formatReport(report.data, report.message.primary),
							styleText("yellow", report.about.id),
							"\n",
						]),
				);

				yield "\n";
			},
			*summarize(summaryContext) {
				yield* presentSummary(counts, summaryContext);
				yield* presentDiagnostics(summaryContext.lintResults.filesResults);
			},
		};
	},
};

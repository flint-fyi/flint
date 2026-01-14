import { formatReport, type NormalizedReport } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

export function createReportSnapshot(
	sourceText: string,
	reports: NormalizedReport[],
) {
	let result = sourceText;

	for (const report of reports.toReversed()) {
		result = createReportSnapshotAt(result, report);
	}

	return result;
}

function createReportSnapshotAt(sourceText: string, report: NormalizedReport) {
	const { begin, end } = report.range;
	const lineStartIndex = sourceText.lastIndexOf("\n", begin.raw) + 1;
	let lineEndIndex = sourceText.indexOf("\n", end.raw);
	if (lineEndIndex < 0) {
		lineEndIndex = sourceText.length;
	}
	const lines = sourceText.slice(lineStartIndex, lineEndIndex).split("\n");
	const output: string[] = [];

	for (let i = begin.line; i <= end.line; i++) {
		const line = nullThrows(
			lines[i - begin.line],
			"Line is expected to be present by the loop condition",
		);

		output.push(line);

		const prevLineIndent = /^[\t ]*/.exec(line)?.[0] ?? "";

		if (i === begin.line) {
			const indent = prevLineIndent.padEnd(begin.column, " ");
			const squiggleEnd = begin.line === end.line ? end.column : line.length;
			output.push(indent.padEnd(squiggleEnd, "~"));
			for (const errorMessageLine of formatReport(
				report.data,
				report.message.primary,
			).split("\n")) {
				output.push(indent + errorMessageLine);
			}
		} else {
			const squiggleEnd = i === end.line ? end.column : line.length;
			output.push(prevLineIndent.padEnd(squiggleEnd, "~"));
		}
	}

	return (
		sourceText.slice(0, lineStartIndex) +
		output.join("\n") +
		sourceText.slice(lineEndIndex)
	);
}

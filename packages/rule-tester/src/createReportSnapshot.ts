import {
	formatReport,
	getPositionOfColumnAndLine,
	type NormalizedReport,
} from "@flint.fyi/core";
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
	const { begin, end } = getDisplayedRange(sourceText, report.range);
	const lineStartIndex = begin.raw - begin.column;
	const lineEndIndex = getLineBounds(sourceText, end.line).end;
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

function getDisplayedRange(
	sourceText: string,
	{ begin, end }: NormalizedReport["range"],
) {
	// Most displayed ranges are normal: the end column shows at least one ~.
	if (end.column > 0 || end.line === begin.line) {
		return { begin, end };
	}

	// For ranges ending at column 0 of a later line, snap the end back to the
	// previous line so the snapshot underlines the last covered line instead.
	const previousLine = getLineBounds(sourceText, end.line - 1);

	if (begin.line === previousLine.line && previousLine.text === "") {
		const currentLine = getLineBounds(sourceText, end.line);

		if (currentLine.text !== "") {
			return {
				begin: {
					column: 0,
					line: currentLine.line,
					raw: currentLine.start,
				},
				end: {
					column: 1,
					line: currentLine.line,
					raw: currentLine.start + 1,
				},
			};
		}
	}

	return {
		begin,
		end: {
			column: previousLine.text.length,
			line: previousLine.line,
			raw: previousLine.end,
		},
	};
}

function getLineBounds(sourceText: string, line: number) {
	const start = getPositionOfColumnAndLine(sourceText, {
		column: 0,
		line,
	});
	let end = sourceText.indexOf("\n", start);
	if (end < 0) {
		end = sourceText.length;
	}

	return {
		end,
		line,
		start,
		text: sourceText.slice(start, end),
	};
}

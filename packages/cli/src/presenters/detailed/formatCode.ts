import type { FileReport } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";
import * as shikiCli from "@shikijs/cli";
import chalk from "chalk";

import { ColorCodes, indenter } from "./constants.ts";

export async function formatCode(report: FileReport, sourceFileText: string) {
	const { begin, end } = report.range;
	const sourceFileLines = sourceFileText.split("\n");
	const sourceLines = sourceFileLines.slice(begin.line, end.line + 1);
	const source = sourceLines.join("\n");

	const highlighted = (
		await shikiCli.codeToANSI(source, "typescript", "nord")
	).trim();

	const highlightedLines = highlighted.split("\n");

	const gutter = `${end.line + 1}:${Math.max(end.column, begin.column) + 1}`;
	const gutterWidth = `${gutter} │ `.length;

	const output: string[] = [];

	for (let i = begin.line; i <= end.line; i++) {
		const sourceLine = nullThrows(
			sourceLines[i - begin.line],
			"Line is expected to be present by the loop condition",
		);

		if (sourceLine.trim() === "") {
			continue;
		}

		const highlightedLine = nullThrows(
			highlightedLines[i - begin.line],
			"Highlighted line is expected to be present by the loop condition",
		);

		const lineNumber = `${i + 1}:${begin.column + 1}`;

		const prevLineIndent = /^[\t ]*/.exec(sourceLine)?.[0] ?? "";

		output.push(
			[
				indenter,
				chalk.hex(ColorCodes.codeLineNumbers)(
					`${lineNumber} `.padStart(gutterWidth - 2),
				),
				chalk.gray("│ "),
				highlightedLine,
			].join(""),
		);

		const indent =
			i === begin.line
				? prevLineIndent.padEnd(begin.column, " ")
				: prevLineIndent;

		const squiggleEnd = i === end.line ? end.column : sourceLine.length;

		output.push(
			[
				indenter,
				chalk.gray("│ ".padStart(gutterWidth)),
				chalk.hex(ColorCodes.codeWarningUnderline)(
					indent.padEnd(squiggleEnd, "~"),
				),
			].join(""),
		);
	}

	return output.join("\n");
}

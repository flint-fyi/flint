import { type FileReport, formatReport } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";
import chalk from "chalk";

import { ColorCodes, indenter } from "./constants.ts";
import { formatCode } from "./formatCode.ts";
import { formatSuggestion } from "./formatSuggestion.ts";
import { wrapIfNeeded } from "./wrapIfNeeded.ts";

export async function* createDetailedReport(
	report: FileReport,
	sourceFileText: string,
	width: number,
) {
	yield indenter;
	yield wrapIfNeeded(
		chalk.hex(ColorCodes.primaryMessage),
		[
			chalk.hex(ColorCodes.ruleBracket)("["),
			chalk
				.hex(ColorCodes.reportAboutId)
				.bold(
					report.about.url
						? formatUrl(report.about.url, report.about.id)
						: report.about.id,
				),
			chalk.hex(ColorCodes.ruleBracket)("]"),
			" ",
			formatReport(report.data, report.message.primary),
		].join(""),
		width,
	);
	yield `\n${indenter}\n`;

	yield await formatCode(report, sourceFileText);
	yield `\n${indenter}\n`;

	yield indenter;
	yield " ";
	yield wrapIfNeeded(
		chalk.hex(ColorCodes.secondaryMessage).italic,
		formatReport(report.data, report.message.secondary.join(`\n`)),
		width,
	);
	yield `\n${indenter}\n`;

	if (report.message.suggestions.length > 1) {
		yield indenter;
		yield chalk.hex(ColorCodes.suggestionTextHighlight)(" Suggestions:");
		yield "\n";
		yield* report.message.suggestions
			.map((suggestion) =>
				[
					indenter,
					chalk.hex(ColorCodes.suggestionMessage)("  • "),
					formatSuggestion(report.data, suggestion),
				].join(""),
			)
			.join("\n");

		yield "\n";
	} else {
		yield `${indenter} `;
		yield wrapIfNeeded(
			chalk.hex(ColorCodes.suggestionTextHighlight),
			`  Suggestion: ${formatSuggestion(report.data, nullThrows(report.message.suggestions[0], `Report ${report.about.id} message should have at least one suggestion`))}`,
			width,
		);
		yield "\n";
	}

	if (report.about.url) {
		yield `${indenter} `;
		yield chalk
			.hex(ColorCodes.ruleUrl)
			.italic(
				`→ ${formatUrl(report.about.url, report.about.url.replace(/^https:\/\//, ""))}`,
			);
	}
}

function formatUrl(url: string, text: string) {
	return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;
}

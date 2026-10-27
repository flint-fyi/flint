import { styleText } from "node:util";

import { formatReport, type FileReport } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

import { ColorCodes, indenter } from "./constants.ts";
import { formatCode } from "./formatCode.ts";
import { formatSuggestion } from "./formatSuggestion.ts";
import { wrapIfNeeded } from "./wrapIfNeeded.ts";

export async function* createDetailedReport(
	report: FileReport,
	sourceFileText: string,
	width: number,
): AsyncGenerator<string, void, void> {
	yield indenter;
	yield wrapIfNeeded(
		(text) => styleText(ColorCodes.primaryMessage, text),
		[
			styleText(ColorCodes.ruleBracket, "["),
			styleText(
				ColorCodes.reportAboutId,
				styleText(
					"bold",
					report.about.url
						? formatUrl(report.about.url, report.about.id)
						: report.about.id,
				),
			),
			styleText(ColorCodes.ruleBracket, "]"),
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
		(text) => styleText(ColorCodes.secondaryMessage, styleText("italic", text)),
		formatReport(report.data, report.message.secondary.join(`\n`)),
		width,
	);
	yield `\n${indenter}\n`;

	if (report.message.suggestions.length > 1) {
		yield indenter;
		yield styleText(ColorCodes.suggestionTextHighlight, " Suggestions:");
		yield "\n";
		yield* report.message.suggestions
			.map((suggestion) =>
				[
					indenter,
					styleText(ColorCodes.suggestionMessage, "  • "),
					formatSuggestion(report.data, suggestion),
				].join(""),
			)
			.join("\n");
	} else {
		yield `${indenter} `;
		yield wrapIfNeeded(
			(text) => styleText(ColorCodes.suggestionTextHighlight, text),
			`  Suggestion: ${formatSuggestion(report.data, nullThrows(report.message.suggestions[0], `Report ${report.about.id} message should have at least one suggestion`))}`,
			width,
		);
	}

	if (!report.about.url) {
		return;
	}

	yield `\n${indenter}\n${indenter} `;
	yield styleText(
		ColorCodes.ruleUrl,
		styleText(
			"italic",
			`→ ${formatUrl(report.about.url, report.about.url.replace(/^https:\/\//, ""))}`,
		),
	);
}

function formatUrl(url: string, text: string) {
	return `\u{1B}]8;;${url}\u{7}${text}\u{1B}]8;;\u{7}`;
}

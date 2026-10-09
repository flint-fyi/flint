import { styleText } from "node:util";

import { formatReport, type ReportInterpolationData } from "@flint.fyi/core";

import { ColorCodes } from "./constants.ts";

export function formatSuggestion(
	data: ReportInterpolationData | undefined,
	suggestion: string,
): string {
	suggestion = formatReport(data, suggestion);

	return [
		styleText(
			ColorCodes.defaultSuggestionColor,
			suggestion
				.split("`")
				.map((text, index) =>
					// wrap-ansi requires styles to reopen after explicit newlines.
					text
						.split("\n")
						.map((line) =>
							styleText(
								index % 2 === 0
									? ColorCodes.defaultSuggestionColor
									: ColorCodes.suggestionTextHighlight,
								line,
							),
						)
						.join("\n"),
				)
				.join("`"),
		),
	].join("");
}

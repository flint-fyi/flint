import { formatReport, type ReportInterpolationData } from "@flint.fyi/core";
import chalk from "chalk";

import { ColorCodes } from "./constants.ts";

export function formatSuggestion(
	data: ReportInterpolationData | undefined,
	suggestion: string,
) {
	suggestion = formatReport(data, suggestion);

	return [
		chalk.hex(ColorCodes.defaultSuggestionColor)(
			suggestion
				.split("`")
				.map((text, index) =>
					chalk.hex(
						index % 2 === 0
							? ColorCodes.defaultSuggestionColor
							: ColorCodes.suggestionTextHighlight,
					)(text),
				)
				.join("`"),
		),
	].join("");
}

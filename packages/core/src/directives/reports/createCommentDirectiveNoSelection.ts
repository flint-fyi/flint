import type { NormalizedReportRangeObject } from "../../types/reports.ts";

export function createCommentDirectiveNoSelection(
	type: string,
	range: NormalizedReportRangeObject,
) {
	return {
		about: {
			id: "commentDirectiveNoSelection",
		},
		message: {
			primary: `Comment directive "${type}" needs to select rule(s).`,
			secondary: ["TODO"],
			suggestions: ["TODO"],
		},
		range,
	};
}

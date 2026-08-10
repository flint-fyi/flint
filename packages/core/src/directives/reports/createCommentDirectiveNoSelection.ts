import type {
	FileReport,
	NormalizedReportRangeObject,
} from "../../types/reports.ts";

export function createCommentDirectiveNoSelection(
	type: string,
	range: NormalizedReportRangeObject,
): FileReport {
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

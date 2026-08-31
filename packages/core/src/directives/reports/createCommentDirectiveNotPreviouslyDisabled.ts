import type {
	FileReport,
	NormalizedReportRangeObject,
} from "../../types/reports.ts";

export function createCommentDirectiveNotPreviouslyDisabled(
	range: NormalizedReportRangeObject,
	selection: string,
): FileReport {
	return {
		about: {
			id: "commentDirectiveNotPreviouslyDisabled",
		},
		message: {
			primary: `The selection "${selection}" was not disabled in a previous comment directive.`,
			secondary: ["TODO"],
			suggestions: ["TODO"],
		},
		range,
	};
}

import type {
	FileReport,
	NormalizedReportRangeObject,
} from "../../types/reports.ts";

export function createCommentDirectiveFileAfterContent(
	range: NormalizedReportRangeObject,
): FileReport {
	return {
		about: {
			id: "commentDirectiveFileAfterContent",
		},
		message: {
			primary: `A "flint-disable-file" comment directive must come before any non-comment contents.`,
			secondary: ["TODO"],
			suggestions: ["TODO"],
		},
		range,
	};
}

import type {
	FileReport,
	NormalizedReportRangeObject,
} from "../../types/reports.ts";

export function createCommentDirectiveUnknown(
	type: string,
	range: NormalizedReportRangeObject,
): FileReport {
	return {
		about: {
			id: "commentDirectiveUnknown",
		},
		message: {
			primary: `Unknown comment directive type: "${type}".`,
			secondary: ["TODO"],
			suggestions: ["TODO"],
		},
		range,
	};
}

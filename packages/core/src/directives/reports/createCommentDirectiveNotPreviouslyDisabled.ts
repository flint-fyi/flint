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
			secondary: [
				'A "disable-lines-end" directive should only close rule selections previously opened by a "disable-lines-begin" directive.',
				"Closing a selection that was never opened has no effect and usually indicates a mismatched rule name or missing begin directive.",
			],
			suggestions: [
				'Verify that the rule name matches the one used in the preceding "flint-disable-lines-begin" directive.',
				'Add a preceding "flint-disable-lines-begin" directive if one is missing.',
				"If the directive is no longer needed, remove it.",
			],
		},
		range,
	};
}

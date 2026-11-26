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
			secondary: [
				"File-level disable directives apply to the entire file and are meant to be placed at the top.",
				"Placing them after code can be confusing because it looks like a regional disable rather than a file-wide one.",
			],
			suggestions: [
				'Move the "flint-disable-file" directive to the top of the file, before any statements.',
				'If you only intended to disable rules for part of the file, use "flint-disable-next-line" or "flint-disable-lines-begin" instead.',
			],
		},
		range,
	};
}

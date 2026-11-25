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
			secondary: [
				'Flint supports "disable-file", "disable-lines-begin", "disable-lines-end", and "disable-next-line" directive types.',
				"Unrecognized directive types are ignored and will not suppress any linting reports.",
			],
			suggestions: [
				'Change the directive to one of the supported types (for example, "flint-disable-next-line").',
				'If this comment is not intended as a Flint directive, change the comment so it does not begin with "flint-".',
			],
		},
		range,
	};
}

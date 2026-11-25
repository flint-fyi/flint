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
			secondary: [
				"Comment directives require at least one rule name or wildcard pattern.",
				"Without any specified rules, the directive cannot determine what to disable and has no effect.",
			],
			suggestions: [
				`Specify one or more rule names or patterns after the directive type, such as "flint-${type} plugin/ruleName".`,
				"If the directive is no longer needed, remove it.",
			],
		},
		range,
	};
}

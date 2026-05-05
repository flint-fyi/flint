import type { CommentDirective } from "../../types/directives.ts";
import type { FileReport } from "../../types/reports.ts";

export function createCommentDirectiveUnused(directive: CommentDirective) {
	const selectionsText =
		directive.selections.length === 1
			? `"${directive.selections[0]}"`
			: directive.selections.map((s) => `"${s}"`).join(", ");

	return {
		about: {
			id: "commentDirectiveUnused",
		},
		message: {
			primary: `The flint-${directive.type} comment directive selecting ${selectionsText} did not match any reports.`,
			secondary: [
				"This directive may be unnecessary if it's not suppressing any linting errors.",
				"Consider removing it if it's no longer needed.",
			],
			suggestions: [
				"If the directive is no longer needed, remove it.",
				"If you expected it to match reports, check that the rule IDs are correct.",
			],
		},
		range: directive.range,
	} satisfies FileReport;
}

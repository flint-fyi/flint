import type { CommentDirective } from "../../types/directives.ts";
import type { FileReport } from "../../types/reports.ts";

export function createCommentDirectiveAlreadyDisabled(
	directive: CommentDirective,
	selection: string,
): FileReport {
	return {
		about: {
			id: "commentDirectiveAlreadyDisabled",
		},
		message: {
			primary: `The selection "${selection}" is already disabled by a previous flint-${directive.type} comment directive.`,
			secondary: [
				"Disabling a rule multiple times in the same scope is redundant.",
				"Redundant directives add noise and can make it harder to tell which directive is active.",
			],
			suggestions: [
				"Remove this redundant directive.",
				"If the earlier directive was unintentional, remove or adjust that directive instead.",
			],
		},
		range: directive.range,
	};
}

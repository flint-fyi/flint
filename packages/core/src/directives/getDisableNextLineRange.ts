import type { CommentDirectiveWithinFile } from "../types/directives.ts";

export function getDisableNextLineRange(directive: CommentDirectiveWithinFile) {
	return {
		begin: directive.range.begin.line + 1,
		end: directive.range.end.line + 1,
	};
}

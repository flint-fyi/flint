import type { CommentDirectiveWithinFile } from "../types/directives.ts";
import type { CharacterReportRange } from "../types/ranges.ts";

export function getDisableNextLineRange(
	directive: CommentDirectiveWithinFile,
): CharacterReportRange {
	return {
		begin: directive.range.begin.line + 1,
		end: directive.range.end.line + 1,
	};
}

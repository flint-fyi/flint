import {
	getPositionOfColumnAndLine,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";

/**
 * Converts an `@astrojs/compiler` position to a string offset.
 * Its 1-based `line` and `column` count UTF-16 code units, but its `offset`
 * counts UTF-8 bytes, so `offset` is wrong after any non-ASCII text.
 */
export function getAstroPointOffset(
	source: SourceFileWithLineMap,
	point: { column: number; line: number },
): number {
	return getPositionOfColumnAndLine(source, {
		column: point.column - 1,
		line: point.line - 1,
	});
}

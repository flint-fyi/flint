import type { FileReport } from "../types/reports.ts";
import type { RangedSelection } from "./computeDirectiveRanges.ts";
import { selectionMatchesReport } from "./selectionMatchesReport.ts";

export function selectionMatchesDirectiveRanges(
	directiveRanges: RangedSelection[],
	report: FileReport,
) {
	// TODO: It'd be faster to use a tracking cursor, binary search tree, or etc.
	// But there should be a small enough number of directives that this is fine.
	// Someone should at least investigate to confirm there's no real perf difference.
	// https://github.com/flint-fyi/flint/issues/247
	const matchingRange = directiveRanges.find(
		(directiveRange) =>
			directiveRange.lines.begin <= report.range.begin.line &&
			directiveRange.lines.end >= report.range.begin.line,
	);

	return (
		!!matchingRange &&
		matchingRange.selections.some((selection) =>
			selectionMatchesReport(selection, report),
		)
	);
}

import type {
	CommentDirective,
	CommentDirectiveWithinFile,
} from "../types/directives.ts";
import type { FileReport } from "../types/reports.ts";
import {
	computeDirectiveRanges,
	type RangedSelection,
} from "./computeDirectiveRanges.ts";
import { createSelectionMatcher } from "./createSelectionMatcher.ts";
import { isCommentDirectiveWithinFile } from "./predicates.ts";
import { selectionMatchesDirectiveRanges } from "./selectionMatchesDirectiveRanges.ts";
import { selectionMatchesReport } from "./selectionMatchesReport.ts";

export interface FilterResult {
	reports: FileReport[];
	unusedDirectives: CommentDirective[];
}

export class DirectivesFilterer {
	#directivesForFile: CommentDirective[] = [];
	#directivesForRanges: CommentDirectiveWithinFile[] = [];

	add(directives: CommentDirective[]) {
		for (const directive of directives) {
			if (isCommentDirectiveWithinFile(directive)) {
				this.#directivesForRanges.push(directive);
			} else {
				this.#directivesForFile.push(directive);
			}
		}
	}

	filter(reports: FileReport[]): FilterResult {
		const selectionsForFile = this.#directivesForFile.flatMap((directive) =>
			directive.selections.map((selection) => ({
				directive,
				matcher: createSelectionMatcher(selection),
				selection,
			})),
		);

		const directiveRanges = computeDirectiveRanges(this.#directivesForRanges);
		const matchedDirectives = new Set<CommentDirective>();

		const filteredReports = reports.filter((report) => {
			const fileMatched = selectionsForFile.some(({ directive, matcher }) => {
				const matches = selectionMatchesReport(matcher, report);
				if (matches) {
					matchedDirectives.add(directive);
				}
				return matches;
			});

			const rangeMatched = selectionMatchesDirectiveRanges(
				directiveRanges,
				report,
			);

			if (rangeMatched) {
				collectMatchedDirectivesForRange(
					directiveRanges,
					report,
					this.#directivesForRanges,
					matchedDirectives,
				);
			}

			return !fileMatched && !rangeMatched;
		});

		const unusedDirectives = [
			...this.#directivesForFile,
			...this.#directivesForRanges,
		].filter((directive) => !matchedDirectives.has(directive));

		return {
			reports: filteredReports,
			unusedDirectives,
		};
	}
}

function collectMatchedDirectivesForRange(
	directiveRanges: RangedSelection[],
	report: FileReport,
	directives: CommentDirectiveWithinFile[],
	matchedDirectives: Set<CommentDirective>,
) {
	for (const range of directiveRanges) {
		if (!rangeContainsReport(range, report)) {
			continue;
		}

		for (const directive of directives) {
			if (isDirectiveInRange(directive, range)) {
				matchedDirectives.add(directive);
			}
		}
	}
}

function isDirectiveInRange(
	directive: CommentDirectiveWithinFile,
	range: RangedSelection,
) {
	const nextDirectiveLine = directive.range.begin.line + 1;

	if (directive.type === "disable-lines-begin") {
		return nextDirectiveLine === range.lines.begin;
	}

	if (directive.type === "disable-lines-end") {
		return directive.range.begin.line === range.lines.end;
	}

	return (
		nextDirectiveLine >= range.lines.begin &&
		nextDirectiveLine <= range.lines.end
	);
}

function rangeContainsReport(range: RangedSelection, report: FileReport) {
	return (
		range.lines.begin <= report.range.begin.line &&
		range.lines.end >= report.range.begin.line
	);
}

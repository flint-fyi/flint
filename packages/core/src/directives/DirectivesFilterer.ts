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
import { getDisableNextLineRange } from "./getDisableNextLineRange.ts";
import { isCommentDirectiveWithinFile } from "./predicates.ts";
import { selectionMatchesDirectiveRanges } from "./selectionMatchesDirectiveRanges.ts";
import { selectionMatchesReport } from "./selectionMatchesReport.ts";

export interface FilterResult {
	reports: FileReport[];
	unusedDirectives: CommentDirective[];
}

interface DirectiveMatch {
	beginSelections?: string[];
	directive: CommentDirectiveWithinFile;
}

type DirectiveSelectionPairs = Map<
	CommentDirectiveWithinFile,
	Map<string, CommentDirectiveWithinFile>
>;

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
		const selectionPairs = computeDirectiveSelectionPairs(
			this.#directivesForRanges,
		);
		const matchedDirectives = new Set<CommentDirective>();
		const matchedBeginSelections = new Map<
			CommentDirectiveWithinFile,
			Set<string>
		>();

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
				for (const match of collectMatchedDirectives(
					directiveRanges,
					report,
					this.#directivesForRanges,
					selectionPairs,
				)) {
					matchedDirectives.add(match.directive);

					if (match.beginSelections) {
						let selections = matchedBeginSelections.get(match.directive);
						if (!selections) {
							selections = new Set();
							matchedBeginSelections.set(match.directive, selections);
						}

						for (const sel of match.beginSelections) {
							selections.add(sel);
						}
					}
				}
			}

			return !fileMatched && !rangeMatched;
		});

		for (const [begin, selectionEnds] of selectionPairs) {
			const usedSelections = matchedBeginSelections.get(begin);
			if (!usedSelections) {
				continue;
			}

			for (const [selection, end] of selectionEnds) {
				if (usedSelections.has(selection)) {
					// `flint-disable-lines-begin` directive matched,
					// mark the corresponding `flint-disable-lines-end` as used as well.
					matchedDirectives.add(end);
				}
			}
		}

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

function collectMatchedDirectives(
	directiveRanges: RangedSelection[],
	report: FileReport,
	directives: CommentDirectiveWithinFile[],
	selectionPairs: DirectiveSelectionPairs,
) {
	const matches: DirectiveMatch[] = [];

	for (const range of directiveRanges) {
		if (!rangeContainsReport(range, report)) {
			continue;
		}

		for (const directive of directives) {
			if (!isDirectiveInRange(directive, range, selectionPairs)) {
				continue;
			}

			let matched = getMatchedSelections(directive, report);
			if (!matched.length) {
				continue;
			}

			if (directive.type === "disable-lines-begin") {
				const selectionEnds = selectionPairs.get(directive);
				matched = matched.filter(
					(sel) =>
						range.lines.begin <= getSelectionScopeEnd(selectionEnds, sel),
				);

				if (!matched.length) {
					continue;
				}
			}

			const match: DirectiveMatch = { directive };
			if (directive.type === "disable-lines-begin") {
				match.beginSelections = matched;
			}
			matches.push(match);
		}
	}

	return matches;
}

function computeDirectiveSelectionPairs(
	directives: CommentDirectiveWithinFile[],
) {
	const pairs: DirectiveSelectionPairs = new Map();
	const openBegins = new Map<string, CommentDirectiveWithinFile[]>();

	for (const directive of directives) {
		if (directive.type === "disable-lines-begin") {
			for (const selection of directive.selections) {
				if (openBegins.get(selection)?.length) {
					continue;
				}

				openBegins.set(selection, [directive]);
			}
		} else if (directive.type === "disable-lines-end") {
			for (const selection of directive.selections) {
				const stack = openBegins.get(selection);
				if (!stack?.length) {
					continue;
				}

				const begin = stack.pop();
				if (begin) {
					let selectionEnds = pairs.get(begin);
					if (!selectionEnds) {
						selectionEnds = new Map();
						pairs.set(begin, selectionEnds);
					}
					selectionEnds.set(selection, directive);
				}
			}
		}
	}

	return pairs;
}

function getMatchedSelections(
	directive: CommentDirectiveWithinFile,
	report: FileReport,
) {
	return directive.selections.filter((selection) =>
		selectionMatchesReport(createSelectionMatcher(selection), report),
	);
}

function getSelectionScopeEnd(
	selectionEnds: Map<string, CommentDirectiveWithinFile> | undefined,
	selection: string,
) {
	const end = selectionEnds?.get(selection);
	return end ? end.range.begin.line : Infinity;
}

function isDirectiveInRange(
	directive: CommentDirectiveWithinFile,
	range: RangedSelection,
	selectionPairs: DirectiveSelectionPairs,
) {
	if (directive.type === "disable-lines-begin") {
		if (range.lines.begin < directive.range.begin.line + 1) {
			return false;
		}

		const selectionEnds = selectionPairs.get(directive);

		for (const selection of directive.selections) {
			if (range.lines.begin <= getSelectionScopeEnd(selectionEnds, selection)) {
				return true;
			}
		}

		return false;
	}

	if (directive.type === "disable-lines-end") {
		return false;
	}

	const nextLineRange = getDisableNextLineRange(directive);
	return (
		nextLineRange.begin <= range.lines.end &&
		nextLineRange.end >= range.lines.begin
	);
}

function rangeContainsReport(range: RangedSelection, report: FileReport) {
	return (
		range.lines.begin <= report.range.begin.line &&
		range.lines.end >= report.range.begin.line
	);
}

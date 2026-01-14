import type {
	CommentDirective,
	CommentDirectiveWithinFile,
} from "../types/directives.ts";
import type { FileReport } from "../types/reports.ts";
import { computeDirectiveRanges } from "./computeDirectiveRanges.ts";
import { createSelectionMatcher } from "./createSelectionMatcher.ts";
import { isCommentDirectiveWithinFile } from "./predicates.ts";
import { selectionMatchesDirectiveRanges } from "./selectionMatchesDirectiveRanges.ts";
import { selectionMatchesReport } from "./selectionMatchesReport.ts";

export class DirectivesFilterer {
	#directivesForRanges: CommentDirectiveWithinFile[] = [];
	#selectionsForFile = new Set<string>();

	add(directives: CommentDirective[]) {
		for (const directive of directives) {
			if (isCommentDirectiveWithinFile(directive)) {
				this.#directivesForRanges.push(directive);
			} else {
				for (const selection of directive.selections) {
					this.#selectionsForFile.add(selection);
				}
			}
		}
	}

	filter(reports: FileReport[]) {
		const directivesForFile = Array.from(this.#selectionsForFile).map(
			createSelectionMatcher,
		);

		const directiveRanges = computeDirectiveRanges(this.#directivesForRanges);

		return reports.filter(
			(report) =>
				!directivesForFile.some((fileDisable) =>
					selectionMatchesReport(fileDisable, report),
				) && !selectionMatchesDirectiveRanges(directiveRanges, report),
		);

		// TODO: Also keep track of which directives/selections did nothing
		// https://github.com/flint-fyi/flint/issues/246
	}
}

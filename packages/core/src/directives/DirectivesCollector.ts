import type { CommentDirective } from "../types/directives.ts";
import type {
	FileReport,
	NormalizedReportRangeObject,
} from "../types/reports.ts";
import { createSelectionMatcher } from "./createSelectionMatcher.ts";
import { isCommentDirectiveType } from "./predicates.ts";
import { directiveReports } from "./reports/directiveReports.ts";

interface CollectedSelection {
	matcher: RegExp;
	selection: string;
}

export class DirectivesCollector {
	#directives: CommentDirective[] = [];
	#redundantDirectives: CommentDirective[] = [];
	#reports: FileReport[] = [];
	#selectionsForFile: CollectedSelection[] = [];
	#selectionsForRanges: CollectedSelection[] = [];

	#statementsStartIndex: number;

	constructor(firstStatementIndex: number) {
		this.#statementsStartIndex = firstStatementIndex;
	}

	add(range: NormalizedReportRangeObject, selection: string, type: string) {
		if (!isCommentDirectiveType(type)) {
			this.#reports.push(directiveReports.createUnknown(type, range));
			return;
		}

		if (!selection) {
			this.#reports.push(directiveReports.createNoSelection(type, range));
			return;
		}

		const selections = selection
			.trim()
			.split(/\s+/)
			.map((text) => text.trim());
		const directive: CommentDirective = { range, selections, type };

		this.#directives.push(directive);

		switch (type) {
			case "disable-file":
				this.#validateDisableFileDirective(directive);
				break;
			case "disable-lines-begin":
				this.#validateDisableLinesBeginDirective(directive);
				break;
			case "disable-lines-end":
				this.#validateDisableLinesEndDirective(directive);
				break;
			case "disable-next-line":
				this.#validateDisableNextLineDirective(directive);
				break;
		}
	}

	collect() {
		return {
			directives: this.#directives,
			redundantDirectives: this.#redundantDirectives,
			reports: this.#reports,
		};
	}

	#validateDisableFileDirective(directive: CommentDirective) {
		if (directive.range.begin.raw > this.#statementsStartIndex) {
			this.#reports.push(
				directiveReports.createFileAfterContent(directive.range),
			);
			return;
		}

		for (const selection of directive.selections) {
			if (selectionAlreadyDisabled(this.#selectionsForFile, selection)) {
				this.#redundantDirectives.push(directive);
				this.#reports.push(
					directiveReports.createAlreadyDisabled(directive, selection),
				);
			} else {
				this.#selectionsForFile.push(createCollectedSelection(selection));
			}
		}
	}

	#validateDisableLinesBeginDirective(directive: CommentDirective) {
		for (const selection of directive.selections) {
			if (
				selectionAlreadyDisabled(this.#selectionsForFile, selection) ||
				selectionAlreadyDisabled(this.#selectionsForRanges, selection)
			) {
				this.#redundantDirectives.push(directive);
				this.#reports.push(
					directiveReports.createAlreadyDisabled(directive, selection),
				);
			} else {
				this.#selectionsForRanges.push(createCollectedSelection(selection));
			}
		}
	}

	#validateDisableLinesEndDirective(directive: CommentDirective) {
		for (const selection of directive.selections) {
			const selectionIndex = this.#selectionsForRanges.findIndex(
				(collectedSelection) => collectedSelection.selection === selection,
			);
			if (selectionIndex !== -1) {
				this.#selectionsForRanges.splice(selectionIndex, 1);
			} else {
				this.#reports.push(
					directiveReports.createNotPreviouslyDisabled(
						directive.range,
						selection,
					),
				);
			}
		}
	}

	#validateDisableNextLineDirective(directive: CommentDirective) {
		for (const selection of directive.selections) {
			if (
				selectionAlreadyDisabled(this.#selectionsForFile, selection) ||
				selectionAlreadyDisabled(this.#selectionsForRanges, selection)
			) {
				this.#redundantDirectives.push(directive);
				this.#reports.push(
					directiveReports.createAlreadyDisabled(directive, selection),
				);
			}
		}
	}
}

function createCollectedSelection(selection: string): CollectedSelection {
	return {
		matcher: createSelectionMatcher(selection),
		selection,
	};
}

function selectionAlreadyDisabled(
	collectedSelections: CollectedSelection[],
	selection: string,
) {
	return collectedSelections.some((collectedSelection) =>
		collectedSelection.matcher.test(selection),
	);
}

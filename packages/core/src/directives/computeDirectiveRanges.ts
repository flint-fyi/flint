import { nullThrows } from "@flint.fyi/utils";

import type { CommentDirectiveWithinFile } from "../types/directives.ts";
import { createSelectionMatcher } from "./createSelectionMatcher.ts";

export interface RangedSelection {
	lines: RangedSelectionLines;

	// TODO: There's got to be a better way.
	// Maybe an existing common one like minimatch?
	// https://github.com/flint-fyi/flint/issues/245
	selections: RegExp[];
}

export interface RangedSelectionLines {
	begin: number;
	end: number;
}

export function computeDirectiveRanges(
	directives: CommentDirectiveWithinFile[],
) {
	if (directives.length === 0) {
		return [];
	}

	if (directives.length === 1) {
		const directive = nullThrows(
			directives[0],
			"Directive is expected to be present by previous length check",
		);
		switch (directive.type) {
			case "disable-lines-begin":
				return [
					{
						lines: {
							begin: directive.range.begin.line + 1,
							end: Infinity,
						},
						selections: directive.selections.map(createSelectionMatcher),
					},
				];

			case "disable-next-line":
				return [
					createRangedSelectionForDisableNextLine(
						directive,
						directive.selections,
					),
				];
		}
	}

	const directivesSorted = directives.toSorted(
		(a, b) => a.range.begin.raw - b.range.begin.raw,
	);

	const rangedSelections: RangedSelection[] = [];
	let previousDirective = nullThrows(
		directivesSorted[0],
		"Previous directive is expected to be present by the loop condition",
	);
	let currentSelections = previousDirective.selections;

	// Handle the first directive
	switch (previousDirective.type) {
		case "disable-lines-begin":
			// Will be handled after the loop
			break;
		case "disable-next-line":
			rangedSelections.push(
				createRangedSelectionForDisableNextLine(
					previousDirective,
					currentSelections,
				),
			);
			break;
	}

	for (const directive of directivesSorted.slice(1)) {
		rangedSelections.push({
			lines: {
				begin:
					previousDirective.range.begin.line +
					(previousDirective.type === "disable-next-line" ? 2 : 1),
				end: directive.range.begin.line,
			},
			selections: currentSelections.map(createSelectionMatcher),
		});

		switch (directive.type) {
			case "disable-lines-begin":
				currentSelections = joinSelections(
					currentSelections,
					directive.selections,
				);
				break;
			case "disable-lines-end":
				currentSelections = removeSelections(
					currentSelections,
					directive.selections,
				);
				break;
			case "disable-next-line":
				rangedSelections.push(
					createRangedSelectionForDisableNextLine(
						directive,
						joinSelections(currentSelections, directive.selections),
					),
				);
				break;
		}

		previousDirective = directive;
	}

	if (currentSelections.length) {
		rangedSelections.push({
			lines: {
				begin:
					previousDirective.range.begin.line +
					(previousDirective.type === "disable-next-line" ? 2 : 1),
				end: Infinity,
			},
			selections: currentSelections.map(createSelectionMatcher),
		});
	}

	return rangedSelections;
}

function createRangedSelectionForDisableNextLine(
	directive: CommentDirectiveWithinFile,
	selections: string[],
): RangedSelection {
	return {
		lines: {
			begin: directive.range.begin.line + 1,
			end: directive.range.end.line + 1,
		},
		selections: selections.map(createSelectionMatcher),
	};
}

function joinSelections(
	currentSelections: string[],
	selections: string[],
): string[] {
	return Array.from(new Set([...currentSelections, ...selections]));
}

function removeSelections(
	currentSelections: string[],
	selections: string[],
): string[] {
	return currentSelections.filter(
		(selection) => !selections.includes(selection),
	);
}

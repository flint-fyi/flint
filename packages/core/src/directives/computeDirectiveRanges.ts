import type { CommentDirectiveWithinFile } from "../types/directives.ts";
import { createSelectionMatcher } from "./createSelectionMatcher.ts";
import { getDisableNextLineRange } from "./getDisableNextLineRange.ts";

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

interface DirectiveEvent {
	action: "off" | "on";
	line: number;
	raw: number;
	selections: string[];
}

export function computeDirectiveRanges(
	directives: CommentDirectiveWithinFile[],
) {
	if (!directives.length) {
		return [];
	}

	const events = directivesToEvents(directives);
	return buildRangesFromEvents(events);
}

function buildRangesFromEvents(events: DirectiveEvent[]) {
	const ranges: RangedSelection[] = [];
	const selectionCounts = new Map<string, number>();
	let segmentStart: null | number = null;

	for (const event of events) {
		const activeBeforeEvent = collectActiveSelections(selectionCounts);

		if (
			activeBeforeEvent.length &&
			segmentStart != null &&
			segmentStart < event.line
		) {
			ranges.push({
				lines: {
					begin: segmentStart,
					end: event.line - 1,
				},
				selections: activeBeforeEvent.map(createSelectionMatcher),
			});
		}

		for (const sel of event.selections) {
			const prev = selectionCounts.get(sel) ?? 0;

			if (event.action === "on") {
				selectionCounts.set(sel, prev + 1);
			} else {
				selectionCounts.set(sel, Math.max(prev - 1, 0));
			}
		}

		const activeAfterEvent = collectActiveSelections(selectionCounts);
		segmentStart = activeAfterEvent.length ? event.line : null;
	}

	const activeFinal = collectActiveSelections(selectionCounts);

	if (activeFinal.length && segmentStart != null) {
		ranges.push({
			lines: {
				begin: segmentStart,
				end: Infinity,
			},
			selections: activeFinal.map(createSelectionMatcher),
		});
	}

	return ranges;
}

function collectActiveSelections(selectionCounts: Map<string, number>) {
	const result = [];

	for (const [sel, count] of selectionCounts) {
		if (count > 0) {
			result.push(sel);
		}
	}

	return result;
}

function directivesToEvents(directives: CommentDirectiveWithinFile[]) {
	const events: DirectiveEvent[] = [];
	const activeBegins = new Set<string>();

	for (const directive of directives) {
		switch (directive.type) {
			case "disable-lines-begin": {
				const selections = directive.selections.filter(
					(sel) => !activeBegins.has(sel),
				);
				if (selections.length) {
					for (const sel of selections) {
						activeBegins.add(sel);
					}
					events.push({
						action: "on",
						line: directive.range.begin.line + 1,
						raw: directive.range.begin.raw,
						selections,
					});
				}
				break;
			}
			case "disable-lines-end": {
				const selections = directive.selections.filter((sel) =>
					activeBegins.has(sel),
				);
				if (selections.length) {
					for (const sel of selections) {
						activeBegins.delete(sel);
					}
					events.push({
						action: "off",
						line: directive.range.begin.line + 1,
						raw: directive.range.begin.raw,
						selections,
					});
				}
				break;
			}
			case "disable-next-line": {
				const range = getDisableNextLineRange(directive);
				events.push(
					{
						action: "on",
						line: range.begin,
						raw: directive.range.begin.raw,
						selections: directive.selections,
					},
					{
						action: "off",
						line: range.end + 1,
						raw: directive.range.begin.raw,
						selections: directive.selections,
					},
				);
				break;
			}
		}
	}

	// Sort by line, then by source position, then off-before-on as final tiebreaker
	events.sort(
		(a, b) =>
			a.line - b.line ||
			a.raw - b.raw ||
			(a.action === "on" ? 1 : 0) - (b.action === "on" ? 1 : 0),
	);

	return events;
}

import { describe, expect, it } from "vitest";

import type { FileReport } from "../types/reports.ts";
import { DirectivesFilterer } from "./DirectivesFilterer.ts";

function createDirectiveRange(beginLine: number, endLine = beginLine) {
	return {
		begin: {
			column: 0,
			line: beginLine,
			raw: beginLine,
		},
		end: {
			column: 0,
			line: endLine,
			raw: endLine,
		},
	};
}

function createReport(forLine: number, id: string) {
	return {
		about: { id },
		message: {
			primary: "",
			secondary: [],
			suggestions: [],
		},
		range: {
			begin: {
				column: 0,
				line: forLine,
				raw: 0,
			},
			end: {
				column: 1,
				line: forLine,
				raw: 1,
			},
		},
	} satisfies FileReport;
}

describe(DirectivesFilterer, () => {
	describe("filter", () => {
		it("returns all reports when no directives have been added", () => {
			const filterer = new DirectivesFilterer();
			const reports = [createReport(0, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports,
				unusedDirectives: [],
			});
		});

		it("returns all reports when no directives apply to them", () => {
			const filterer = new DirectivesFilterer();

			const directive = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["*other*"],
				type: "disable-next-line" as const,
			};

			filterer.add([directive]);

			const reports = [createReport(0, "example"), createReport(1, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports,
				unusedDirectives: [directive],
			});
		});

		it("returns unfiltered reports when a directive filters one report", () => {
			const filterer = new DirectivesFilterer();

			filterer.add([
				{
					range: {
						begin: {
							column: 0,
							line: 0,
							raw: 0,
						},
						end: {
							column: 0,
							line: 0,
							raw: 0,
						},
					},
					selections: ["example"],
					type: "disable-next-line",
				},
			]);

			const reports = [createReport(0, "example"), createReport(1, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [reports[0]],
				unusedDirectives: [],
			});
		});

		it("suppresses reports on comment lines before an extended disable-next-line target", () => {
			const filterer = new DirectivesFilterer();

			filterer.add([
				{
					range: createDirectiveRange(0, 1),
					selections: ["example"],
					type: "disable-next-line",
				},
			]);

			const reports = [createReport(1, "example"), createReport(2, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [],
			});
		});

		it("identifies unused file directives that don't match any reports", () => {
			const filterer = new DirectivesFilterer();

			const unusedDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["*other*"],
				type: "disable-file" as const,
			};

			filterer.add([unusedDirective]);

			const reports = [createReport(0, "example"), createReport(1, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports,
				unusedDirectives: [unusedDirective],
			});
		});

		it("does not include used file directives in unusedDirectives", () => {
			const filterer = new DirectivesFilterer();

			const usedDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["example"],
				type: "disable-file" as const,
			};

			filterer.add([usedDirective]);

			const reports = [createReport(0, "example"), createReport(1, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [],
			});
		});

		it("identifies only unused file directives when some are used and some are not", () => {
			const filterer = new DirectivesFilterer();

			const usedDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["example"],
				type: "disable-file" as const,
			};

			const unusedDirective1 = {
				range: {
					begin: {
						column: 0,
						line: 1,
						raw: 1,
					},
					end: {
						column: 0,
						line: 1,
						raw: 1,
					},
				},
				selections: ["*other*"],
				type: "disable-file" as const,
			};

			const unusedDirective2 = {
				range: {
					begin: {
						column: 0,
						line: 2,
						raw: 2,
					},
					end: {
						column: 0,
						line: 2,
						raw: 2,
					},
				},
				selections: ["*unused*"],
				type: "disable-file" as const,
			};

			filterer.add([usedDirective, unusedDirective1, unusedDirective2]);

			const reports = [createReport(0, "example"), createReport(1, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [unusedDirective1, unusedDirective2],
			});
		});

		it("identifies unused file directives when directive has multiple selections and none match", () => {
			const filterer = new DirectivesFilterer();

			const unusedDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["rule1", "rule2", "rule3"],
				type: "disable-file" as const,
			};

			filterer.add([unusedDirective]);

			const reports = [createReport(0, "example"), createReport(1, "other")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports,
				unusedDirectives: [unusedDirective],
			});
		});

		it("does not identify file directive as unused when at least one selection matches", () => {
			const filterer = new DirectivesFilterer();

			const usedDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["rule1", "example", "rule3"],
				type: "disable-file" as const,
			};

			filterer.add([usedDirective]);

			const reports = [createReport(0, "example"), createReport(1, "other")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [reports[1]],
				unusedDirectives: [],
			});
		});

		it("marks disable-lines-begin as used when its range suppresses a report", () => {
			const filterer = new DirectivesFilterer();

			const beginDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["example"],
				type: "disable-lines-begin" as const,
			};

			filterer.add([beginDirective]);

			// Report on line 1 should be suppressed (begin is on line 0, range starts at line 1)
			const reports = [createReport(1, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [],
			});
		});

		it("marks disable-lines-end as used when its range suppresses a report", () => {
			const filterer = new DirectivesFilterer();

			const beginDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["example"],
				type: "disable-lines-begin" as const,
			};

			const endDirective = {
				range: {
					begin: {
						column: 0,
						line: 5,
						raw: 5,
					},
					end: {
						column: 0,
						line: 5,
						raw: 5,
					},
				},
				selections: ["example"],
				type: "disable-lines-end" as const,
			};

			filterer.add([beginDirective, endDirective]);

			// Report on line 3 should be suppressed (range is lines 1-5)
			const reports = [createReport(3, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [],
			});
		});

		it("suppresses reports for multiple disable-next-line directives on the same extended line", () => {
			const filterer = new DirectivesFilterer();

			const aaaDirective = {
				range: createDirectiveRange(0, 2),
				selections: ["aaa"],
				type: "disable-next-line" as const,
			};

			const bbbDirective = {
				range: createDirectiveRange(1, 2),
				selections: ["bbb"],
				type: "disable-next-line" as const,
			};

			filterer.add([aaaDirective, bbbDirective]);

			expect(
				filterer.filter([createReport(3, "aaa"), createReport(3, "bbb")]),
			).toEqual({
				reports: [],
				unusedDirectives: [],
			});
		});

		it("marks begin directives as used when their active selections suppress an extended disable-next-line target", () => {
			const filterer = new DirectivesFilterer();

			const beginDirective = {
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-lines-begin" as const,
			};

			const nextLineDirective = {
				range: createDirectiveRange(1, 3),
				selections: ["bbb"],
				type: "disable-next-line" as const,
			};

			filterer.add([beginDirective, nextLineDirective]);

			expect(filterer.filter([createReport(4, "aaa")])).toEqual({
				reports: [],
				unusedDirectives: [nextLineDirective],
			});
		});

		it("marks disable-lines-end as used when an earlier split segment suppresses a report", () => {
			const filterer = new DirectivesFilterer();

			const beginDirective = {
				range: {
					begin: { column: 0, line: 0, raw: 0 },
					end: { column: 0, line: 0, raw: 0 },
				},
				selections: ["aaa"],
				type: "disable-lines-begin" as const,
			};

			const nextLineDirective = {
				range: {
					begin: { column: 0, line: 1, raw: 1 },
					end: { column: 0, line: 1, raw: 1 },
				},
				selections: ["bbb"],
				type: "disable-next-line" as const,
			};

			const endDirective = {
				range: {
					begin: { column: 0, line: 4, raw: 4 },
					end: { column: 0, line: 4, raw: 4 },
				},
				selections: ["aaa"],
				type: "disable-lines-end" as const,
			};

			filterer.add([beginDirective, nextLineDirective, endDirective]);

			expect(filterer.filter([createReport(1, "aaa")])).toEqual({
				reports: [],
				unusedDirectives: [nextLineDirective],
			});
		});

		it("marks both begin and end as used when a split block segment suppresses a report", () => {
			const filterer = new DirectivesFilterer();

			// begin aaa on line 0 → range starts at line 1
			const beginDirective = {
				range: {
					begin: { column: 0, line: 0, raw: 0 },
					end: { column: 0, line: 0, raw: 0 },
				},
				selections: ["aaa"],
				type: "disable-lines-begin" as const,
			};

			// disable-next-line bbb on line 3 splits the begin block
			const nextLineDirective = {
				range: {
					begin: { column: 0, line: 3, raw: 3 },
					end: { column: 0, line: 3, raw: 3 },
				},
				selections: ["bbb"],
				type: "disable-next-line" as const,
			};

			// end aaa on line 6 → range ends at line 6
			const endDirective = {
				range: {
					begin: { column: 0, line: 6, raw: 6 },
					end: { column: 0, line: 6, raw: 6 },
				},
				selections: ["aaa"],
				type: "disable-lines-end" as const,
			};

			filterer.add([beginDirective, nextLineDirective, endDirective]);

			// Report at line 5 falls in the segment after the next-line split (lines 5-6)
			// Both begin and end should be marked as used
			const reports = [createReport(5, "aaa")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [nextLineDirective],
			});
		});

		it("marks both begin and end as unused when block doesn't suppress any reports", () => {
			const filterer = new DirectivesFilterer();

			const beginDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["other-rule"],
				type: "disable-lines-begin" as const,
			};

			const endDirective = {
				range: {
					begin: {
						column: 0,
						line: 5,
						raw: 5,
					},
					end: {
						column: 0,
						line: 5,
						raw: 5,
					},
				},
				selections: ["other-rule"],
				type: "disable-lines-end" as const,
			};

			filterer.add([beginDirective, endDirective]);

			// Report doesn't match the directive's selection
			const reports = [createReport(3, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports,
				unusedDirectives: [beginDirective, endDirective],
			});
		});

		it("marks unclosed disable-lines-begin as used when it suppresses a report", () => {
			const filterer = new DirectivesFilterer();

			const beginDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["example"],
				type: "disable-lines-begin" as const,
			};

			filterer.add([beginDirective]);

			// Report on line 100 should still be suppressed (unclosed range goes to Infinity)
			const reports = [createReport(100, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [],
			});
		});

		it("only marks directives as used when their selections match the suppressed report", () => {
			const filterer = new DirectivesFilterer();

			const usedBeginDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["example"],
				type: "disable-lines-begin" as const,
			};

			const usedEndDirective = {
				range: {
					begin: {
						column: 0,
						line: 5,
						raw: 5,
					},
					end: {
						column: 0,
						line: 5,
						raw: 5,
					},
				},
				selections: ["example"],
				type: "disable-lines-end" as const,
			};

			// Different block that doesn't match any reports
			const unusedBeginDirective = {
				range: {
					begin: {
						column: 0,
						line: 10,
						raw: 10,
					},
					end: {
						column: 0,
						line: 10,
						raw: 10,
					},
				},
				selections: ["other-rule"],
				type: "disable-lines-begin" as const,
			};

			const unusedEndDirective = {
				range: {
					begin: {
						column: 0,
						line: 15,
						raw: 15,
					},
					end: {
						column: 0,
						line: 15,
						raw: 15,
					},
				},
				selections: ["other-rule"],
				type: "disable-lines-end" as const,
			};

			filterer.add([
				usedBeginDirective,
				usedEndDirective,
				unusedBeginDirective,
				unusedEndDirective,
			]);

			// Only "example" report at line 3 (in first block), no reports for "other-rule"
			const reports = [createReport(3, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [unusedBeginDirective, unusedEndDirective],
			});
		});

		it("only marks directives in the matching range as used when multiple blocks have the same selection", () => {
			const filterer = new DirectivesFilterer();

			// First block - should be marked as used (suppresses the report)
			const usedBeginDirective = {
				range: {
					begin: {
						column: 0,
						line: 0,
						raw: 0,
					},
					end: {
						column: 0,
						line: 0,
						raw: 0,
					},
				},
				selections: ["example"],
				type: "disable-lines-begin" as const,
			};

			const usedEndDirective = {
				range: {
					begin: {
						column: 0,
						line: 5,
						raw: 5,
					},
					end: {
						column: 0,
						line: 5,
						raw: 5,
					},
				},
				selections: ["example"],
				type: "disable-lines-end" as const,
			};

			// Second block with SAME selection - should NOT be marked as used
			// because no reports fall within its range
			const unusedBeginDirective = {
				range: {
					begin: {
						column: 0,
						line: 10,
						raw: 10,
					},
					end: {
						column: 0,
						line: 10,
						raw: 10,
					},
				},
				selections: ["example"],
				type: "disable-lines-begin" as const,
			};

			const unusedEndDirective = {
				range: {
					begin: {
						column: 0,
						line: 15,
						raw: 15,
					},
					end: {
						column: 0,
						line: 15,
						raw: 15,
					},
				},
				selections: ["example"],
				type: "disable-lines-end" as const,
			};

			filterer.add([
				usedBeginDirective,
				usedEndDirective,
				unusedBeginDirective,
				unusedEndDirective,
			]);

			// Report at line 3 is only in the first block's range (1-5),
			// not in the second block's range (11-15)
			const reports = [createReport(3, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [unusedBeginDirective, unusedEndDirective],
			});
		});

		it("attributes used/unused per selection when begin has multiple selections with separate ends", () => {
			const filterer = new DirectivesFilterer();

			// begin aaa bbb on line 0
			const beginDirective = {
				range: {
					begin: { column: 0, line: 0, raw: 0 },
					end: { column: 0, line: 0, raw: 0 },
				},
				selections: ["aaa", "bbb"],
				type: "disable-lines-begin" as const,
			};

			// end aaa on line 5
			const endAaaDirective = {
				range: {
					begin: { column: 0, line: 5, raw: 5 },
					end: { column: 0, line: 5, raw: 5 },
				},
				selections: ["aaa"],
				type: "disable-lines-end" as const,
			};

			// end bbb on line 8
			const endBbbDirective = {
				range: {
					begin: { column: 0, line: 8, raw: 8 },
					end: { column: 0, line: 8, raw: 8 },
				},
				selections: ["bbb"],
				type: "disable-lines-end" as const,
			};

			filterer.add([beginDirective, endAaaDirective, endBbbDirective]);

			// Only "aaa" report at line 3 — aaa is used, bbb is unused
			const reports = [createReport(3, "aaa")];
			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [endBbbDirective],
			});
		});

		it("marks begin as used when one selection is closed but the other still suppresses", () => {
			const filterer = new DirectivesFilterer();

			// begin aaa bbb on line 0
			const beginDirective = {
				range: {
					begin: { column: 0, line: 0, raw: 0 },
					end: { column: 0, line: 0, raw: 0 },
				},
				selections: ["aaa", "bbb"],
				type: "disable-lines-begin" as const,
			};

			// end aaa on line 5
			const endAaaDirective = {
				range: {
					begin: { column: 0, line: 5, raw: 5 },
					end: { column: 0, line: 5, raw: 5 },
				},
				selections: ["aaa"],
				type: "disable-lines-end" as const,
			};

			// end bbb on line 10
			const endBbbDirective = {
				range: {
					begin: { column: 0, line: 10, raw: 10 },
					end: { column: 0, line: 10, raw: 10 },
				},
				selections: ["bbb"],
				type: "disable-lines-end" as const,
			};

			filterer.add([beginDirective, endAaaDirective, endBbbDirective]);

			// bbb report at line 7 — after aaa was closed but before bbb is closed
			const reports = [createReport(7, "bbb")];
			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [endAaaDirective],
			});
		});

		it("does not mark a closed selection's end as used when a wildcard on the same begin suppresses the report", () => {
			const filterer = new DirectivesFilterer();

			// begin foo * on line 0
			const beginDirective = {
				range: {
					begin: { column: 0, line: 0, raw: 0 },
					end: { column: 0, line: 0, raw: 0 },
				},
				selections: ["foo", "*"],
				type: "disable-lines-begin" as const,
			};

			// end foo on line 5
			const endFooDirective = {
				range: {
					begin: { column: 0, line: 5, raw: 5 },
					end: { column: 0, line: 5, raw: 5 },
				},
				selections: ["foo"],
				type: "disable-lines-end" as const,
			};

			filterer.add([beginDirective, endFooDirective]);

			// foo report at line 7 — after foo was closed.
			// * still covers it, but foo should NOT be credited.
			const reports = [createReport(7, "foo")];
			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [endFooDirective],
			});
		});

		it("does not misreport end as unused when a duplicate begin precedes it", () => {
			const filterer = new DirectivesFilterer();

			const beginA = {
				range: {
					begin: { column: 0, line: 0, raw: 0 },
					end: { column: 0, line: 0, raw: 0 },
				},
				selections: ["foo"],
				type: "disable-lines-begin" as const,
			};

			// Duplicate begin — reported as already disabled, but still forwarded
			const beginB = {
				range: {
					begin: { column: 0, line: 2, raw: 2 },
					end: { column: 0, line: 2, raw: 2 },
				},
				selections: ["foo"],
				type: "disable-lines-begin" as const,
			};

			const endDirective = {
				range: {
					begin: { column: 0, line: 5, raw: 5 },
					end: { column: 0, line: 5, raw: 5 },
				},
				selections: ["foo"],
				type: "disable-lines-end" as const,
			};

			filterer.add([beginA, beginB, endDirective]);

			// Report at line 3 suppressed by beginA; end pairs with beginA, not beginB
			expect(filterer.filter([createReport(3, "foo")])).toEqual({
				reports: [],
				unusedDirectives: [beginB],
			});
		});

		it("marks disable-next-line as used only when report is on its target line", () => {
			const filterer = new DirectivesFilterer();

			// disable-next-line at line 3, covers only line 4
			const usedNextLine = {
				range: {
					begin: { column: 0, line: 3, raw: 3 },
					end: { column: 0, line: 3, raw: 3 },
				},
				selections: ["example"],
				type: "disable-next-line" as const,
			};

			// disable-next-line at line 10, covers only line 11
			const unusedNextLine = {
				range: {
					begin: { column: 0, line: 10, raw: 10 },
					end: { column: 0, line: 10, raw: 10 },
				},
				selections: ["example"],
				type: "disable-next-line" as const,
			};

			filterer.add([usedNextLine, unusedNextLine]);

			// Report at line 4 - matches usedNextLine's target, not unusedNextLine's
			const reports = [createReport(4, "example")];

			const actual = filterer.filter(reports);

			expect(actual).toEqual({
				reports: [],
				unusedDirectives: [unusedNextLine],
			});
		});
	});
});

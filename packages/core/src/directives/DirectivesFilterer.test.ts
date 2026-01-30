import { describe, expect, it } from "vitest";

import type { FileReport } from "../types/reports.ts";
import { DirectivesFilterer } from "./DirectivesFilterer.ts";

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

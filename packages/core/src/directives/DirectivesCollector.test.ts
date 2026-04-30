import { describe, expect, it } from "vitest";

import type { NormalizedReportRangeObject } from "../types/reports.ts";
import { DirectivesCollector } from "./DirectivesCollector.ts";
import { directiveReports } from "./reports/directiveReports.ts";

function createRange(forPosition: number, beginLine = 0, endLine = 1) {
	return {
		begin: {
			column: 0,
			line: beginLine,
			raw: forPosition,
		},
		end: {
			column: 0,
			line: endLine,
			raw: forPosition + 1,
		},
	} satisfies NormalizedReportRangeObject;
}

describe(DirectivesCollector, () => {
	it("generates a report when an invalid comment directive type is added", () => {
		const collector = new DirectivesCollector(0);
		const range = createRange(0);

		collector.add(range, "*", "other");

		const actual = collector.collect();

		expect(actual).toEqual({
			directives: [],
			reports: [directiveReports.createUnknown("other", range)],
		});
	});

	it("generates a report when an empty rules selection is added", () => {
		const collector = new DirectivesCollector(0);
		const range = createRange(0);

		collector.add(range, "", "disable-file");

		const actual = collector.collect();

		expect(actual).toEqual({
			directives: [],
			reports: [directiveReports.createNoSelection("disable-file", range)],
		});
	});

	describe("disable-file", () => {
		it("generates a report when the directive is after the first statement index", () => {
			const collector = new DirectivesCollector(1);
			const range = createRange(2);

			collector.add(range, "*", "disable-file");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range,
						selections: ["*"],
						type: "disable-file",
					},
				],
				reports: [directiveReports.createFileAfterContent(range)],
			});
		});

		it("generates a report when a directive repeats a previous selection", () => {
			const collector = new DirectivesCollector(2);

			collector.add(createRange(0), "a b", "disable-file");
			collector.add(createRange(1), "b c", "disable-file");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range: createRange(0),
						selections: ["a", "b"],
						type: "disable-file",
					},
					{
						range: createRange(1),
						selections: ["b", "c"],
						type: "disable-file",
					},
				],
				reports: [
					directiveReports.createAlreadyDisabled(
						{
							range: createRange(1),
							selections: ["c"],
							type: "disable-file",
						},
						"b",
					),
				],
			});
		});

		it("deduplicates repeated selections in a single directive", () => {
			const collector = new DirectivesCollector(0);
			const range = createRange(0);

			collector.add(range, "a a b", "disable-file");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range,
						selections: ["a", "b"],
						type: "disable-file",
					},
				],
				reports: [],
			});
		});

		it("trims whitespaces around selection", () => {
			const collector = new DirectivesCollector(1);
			const range = createRange(2);

			collector.add(range, " a ", "disable-file");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range,
						selections: ["a"],
						type: "disable-file",
					},
				],
				reports: [directiveReports.createFileAfterContent(range)],
			});
		});
	});

	describe("disable-lines-begin", () => {
		it("generates a report when a directive repeats a previous file selection", () => {
			const collector = new DirectivesCollector(2);

			collector.add(createRange(0), "a b", "disable-file");
			collector.add(createRange(1), "b c", "disable-next-line");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range: createRange(0),
						selections: ["a", "b"],
						type: "disable-file",
					},
					{
						range: createRange(1),
						selections: ["b", "c"],
						type: "disable-next-line",
					},
				],
				reports: [
					directiveReports.createAlreadyDisabled(
						{
							range: createRange(1),
							selections: ["b", "c"],
							type: "disable-next-line",
						},
						"b",
					),
				],
			});
		});

		it("generates a report when a directive repeats a previous lines selection", () => {
			const collector = new DirectivesCollector(2);

			collector.add(createRange(0), "a b", "disable-lines-begin");
			collector.add(createRange(1), "b c", "disable-lines-begin");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range: createRange(0),
						selections: ["a", "b"],
						type: "disable-lines-begin",
					},
					{
						range: createRange(1),
						selections: ["b", "c"],
						type: "disable-lines-begin",
					},
				],
				reports: [
					directiveReports.createAlreadyDisabled(
						{
							range: createRange(1),
							selections: ["c"],
							type: "disable-lines-begin",
						},
						"b",
					),
				],
			});
		});
	});

	describe("disable-lines-end", () => {
		it("generates a report when a directive does not close a previous selection", () => {
			const collector = new DirectivesCollector(2);

			collector.add(createRange(0), "a b", "disable-lines-begin");
			collector.add(createRange(1), "b c", "disable-lines-end");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range: createRange(0),
						selections: ["a", "b"],
						type: "disable-lines-begin",
					},
					{
						range: createRange(1),
						selections: ["b", "c"],
						type: "disable-lines-end",
					},
				],
				reports: [
					directiveReports.createNotPreviouslyDisabled(createRange(1), "c"),
				],
			});
		});
	});

	describe("disable-next-line", () => {
		it("generates a report when a directive repeats a previous file selection", () => {
			const collector = new DirectivesCollector(2);

			collector.add(createRange(0), "a b", "disable-file");
			collector.add(createRange(1), "b c", "disable-next-line");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range: createRange(0),
						selections: ["a", "b"],
						type: "disable-file",
					},
					{
						range: createRange(1),
						selections: ["b", "c"],
						type: "disable-next-line",
					},
				],
				reports: [
					directiveReports.createAlreadyDisabled(
						{
							range: createRange(1),
							selections: ["c"],
							type: "disable-next-line",
						},
						"b",
					),
				],
			});
		});

		it("generates a report when a directive repeats a previous lines selection", () => {
			const collector = new DirectivesCollector(2);

			collector.add(createRange(0), "a b", "disable-lines-begin");
			collector.add(createRange(1), "b c", "disable-next-line");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range: createRange(0),
						selections: ["a", "b"],
						type: "disable-lines-begin",
					},
					{
						range: createRange(1),
						selections: ["b", "c"],
						type: "disable-next-line",
					},
				],
				reports: [
					directiveReports.createAlreadyDisabled(
						{
							range: createRange(1),
							selections: ["b", "c"],
							type: "disable-next-line",
						},
						"b",
					),
				],
			});
		});

		it("does not report already disabled for multiple disable-next-line directives sharing an extended line", () => {
			const collector = new DirectivesCollector(0);

			collector.add(createRange(0, 0, 2), "aaa", "disable-next-line");
			collector.add(createRange(2, 1, 2), "aaa", "disable-next-line");

			expect(collector.collect()).toEqual({
				directives: [
					{
						range: createRange(0, 0, 2),
						selections: ["aaa"],
						type: "disable-next-line",
					},
					{
						range: createRange(2, 1, 2),
						selections: ["aaa"],
						type: "disable-next-line",
					},
				],
				reports: [],
			});
		});

		it("validates newly added deferred directives on a subsequent collect() after more add() calls", () => {
			const collector = new DirectivesCollector(0);

			collector.add(createRange(0, 0, 0), "aaa", "disable-lines-begin");

			// First collect — no deferred next-line directives yet
			const first = collector.collect();
			expect(first.reports).toHaveLength(0);

			// Add a deferred next-line that overlaps with the begin
			collector.add(createRange(4, 2, 4), "aaa", "disable-next-line");

			// Second collect — must pick up the new deferred directive
			const second = collector.collect();
			expect(second.reports).toHaveLength(1);
		});

		it("reports already disabled when a begin directive is added after a deferred next-line was already collected", () => {
			const collector = new DirectivesCollector(0);

			// Add a deferred next-line targeting line 5
			collector.add(createRange(0, 0, 4), "aaa", "disable-next-line");

			// First collect — no begin block yet, so 0 reports
			const first = collector.collect();
			expect(first.reports).toHaveLength(0);

			// Add a begin that covers line 5
			collector.add(createRange(6, 3, 3), "aaa", "disable-lines-begin");

			// Second collect — line 5 is now covered by the begin, should report alreadyDisabled
			const second = collector.collect();
			expect(second.reports).toHaveLength(1);
		});

		it("does not report already disabled when an intervening end closes the selection before the target line", () => {
			const collector = new DirectivesCollector(0);

			collector.add(createRange(0, 0, 0), "aaa", "disable-lines-begin");
			collector.add(createRange(2, 1, 3), "aaa", "disable-next-line");
			collector.add(createRange(4, 2, 2), "aaa", "disable-lines-end");

			expect(collector.collect()).toEqual({
				directives: [
					{
						range: createRange(0, 0, 0),
						selections: ["aaa"],
						type: "disable-lines-begin",
					},
					{
						range: createRange(2, 1, 3),
						selections: ["aaa"],
						type: "disable-next-line",
					},
					{
						range: createRange(4, 2, 2),
						selections: ["aaa"],
						type: "disable-lines-end",
					},
				],
				reports: [],
			});
		});
	});
});

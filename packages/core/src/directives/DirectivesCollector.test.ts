import { describe, expect, it } from "vitest";

import type { NormalizedReportRangeObject } from "../types/reports.ts";
import { DirectivesCollector } from "./DirectivesCollector.ts";
import { directiveReports } from "./reports/directiveReports.ts";

function createRange(forPosition: number) {
	return {
		begin: {
			column: 0,
			line: 0,
			raw: forPosition,
		},
		end: {
			column: 0,
			line: 1,
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
			redundantDirectives: [],
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
			redundantDirectives: [],
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
				redundantDirectives: [],
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
				redundantDirectives: [
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

		it("generates a report when a directive selection is covered by a previous wildcard selection", () => {
			const collector = new DirectivesCollector(2);

			collector.add(createRange(0), "a*", "disable-file");
			collector.add(createRange(1), "ab*", "disable-file");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range: createRange(0),
						selections: ["a*"],
						type: "disable-file",
					},
					{
						range: createRange(1),
						selections: ["ab*"],
						type: "disable-file",
					},
				],
				redundantDirectives: [
					{
						range: createRange(1),
						selections: ["ab*"],
						type: "disable-file",
					},
				],
				reports: [
					directiveReports.createAlreadyDisabled(
						{
							range: createRange(1),
							selections: ["ab*"],
							type: "disable-file",
						},
						"ab*",
					),
				],
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
				redundantDirectives: [],
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
				redundantDirectives: [
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
				redundantDirectives: [
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

		it("generates a report when a directive selection is covered by a previous file wildcard selection", () => {
			const collector = new DirectivesCollector(2);

			collector.add(createRange(0), "a*", "disable-file");
			collector.add(createRange(1), "ab*", "disable-lines-begin");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range: createRange(0),
						selections: ["a*"],
						type: "disable-file",
					},
					{
						range: createRange(1),
						selections: ["ab*"],
						type: "disable-lines-begin",
					},
				],
				redundantDirectives: [
					{
						range: createRange(1),
						selections: ["ab*"],
						type: "disable-lines-begin",
					},
				],
				reports: [
					directiveReports.createAlreadyDisabled(
						{
							range: createRange(1),
							selections: ["ab*"],
							type: "disable-lines-begin",
						},
						"ab*",
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
				redundantDirectives: [],
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
				redundantDirectives: [
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
				redundantDirectives: [
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

		it("generates a report when a directive selection is covered by a previous wildcard selection", () => {
			const collector = new DirectivesCollector(2);

			collector.add(createRange(0), "a*", "disable-lines-begin");
			collector.add(createRange(1), "ab*", "disable-next-line");

			const actual = collector.collect();

			expect(actual).toEqual({
				directives: [
					{
						range: createRange(0),
						selections: ["a*"],
						type: "disable-lines-begin",
					},
					{
						range: createRange(1),
						selections: ["ab*"],
						type: "disable-next-line",
					},
				],
				redundantDirectives: [
					{
						range: createRange(1),
						selections: ["ab*"],
						type: "disable-next-line",
					},
				],
				reports: [
					directiveReports.createAlreadyDisabled(
						{
							range: createRange(1),
							selections: ["ab*"],
							type: "disable-next-line",
						},
						"ab*",
					),
				],
			});
		});
	});
});

import { describe, expect, it } from "vitest";

import { computeDirectiveRanges } from "./computeDirectiveRanges.ts";

function createDirectiveRange(beginLine: number, endLine = beginLine) {
	return {
		begin: {
			column: 0,
			line: beginLine,
			raw: beginLine,
		},
		end: {
			column: 1,
			line: endLine,
			raw: endLine,
		},
	};
}

describe(computeDirectiveRanges, () => {
	it("returns [] when no directives are provided", () => {
		const actual = computeDirectiveRanges([]);
		expect(actual).toEqual([]);
	});

	it("returns a single range when one disable-lines-begin directive is provided", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-lines-begin",
			},
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: Infinity,
				},
				selections: [/^aaa$/],
			},
		]);
	});

	it("returns a single range when one disable-next-line directive is provided", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-next-line",
			},
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: 1,
				},
				selections: [/^aaa$/],
			},
		]);
	});

	it("returns two ranges when a disable-lines-begin and then an equivalent disable-lines-end are provided", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa", "bbb"],
				type: "disable-lines-begin",
			},
			{
				range: createDirectiveRange(3),
				selections: ["aaa", "bbb"],
				type: "disable-lines-end",
			},
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: 3,
				},
				selections: [/^aaa$/, /^bbb$/],
			},
		]);
	});

	it("returns three ranges when a disable-lines-begin and then a partial disable-lines-end are provided", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa", "bbb"],
				type: "disable-lines-begin",
			},
			{
				range: createDirectiveRange(3),
				selections: ["aaa"],
				type: "disable-lines-end",
			},
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: 3,
				},
				selections: [/^aaa$/, /^bbb$/],
			},
			{
				lines: {
					begin: 4,
					end: Infinity,
				},
				selections: [/^bbb$/],
			},
		]);
	});

	it("returns three ranges when a disable-lines-begin and then a disable-next-line are provided", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa", "bbb"],
				type: "disable-lines-begin",
			},
			{
				range: createDirectiveRange(1),
				selections: ["ccc"],
				type: "disable-next-line",
			},
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: 1,
				},
				selections: [/^aaa$/, /^bbb$/],
			},
			{
				lines: {
					begin: 2,
					end: 2,
				},
				selections: [/^aaa$/, /^bbb$/, /^ccc$/],
			},
			{
				lines: {
					begin: 3,
					end: Infinity,
				},
				selections: [/^aaa$/, /^bbb$/],
			},
		]);
	});

	it("uses range.end.line to extend disable-next-line ranges", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(1, 3),
				selections: ["aaa"],
				type: "disable-next-line",
			},
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 2,
					end: 4,
				},
				selections: [/^aaa$/],
			},
		]);
	});

	it("applies intervening range changes inside an extended disable-next-line range", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-lines-begin",
			},
			{
				range: createDirectiveRange(1, 3),
				selections: ["bbb"],
				type: "disable-next-line",
			},
			{
				range: createDirectiveRange(2),
				selections: ["aaa"],
				type: "disable-lines-end",
			},
		]);

		expect(actual).toEqual([
			{
				lines: { begin: 1, end: 1 },
				selections: [/^aaa$/],
			},
			{
				lines: { begin: 2, end: 2 },
				selections: [/^aaa$/, /^bbb$/],
			},
			{
				lines: { begin: 3, end: 4 },
				selections: [/^bbb$/],
			},
		]);
	});

	it("merges an extended disable-next-line range into an active begin block", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-lines-begin",
			},
			{
				range: createDirectiveRange(1, 2),
				selections: ["bbb"],
				type: "disable-next-line",
			},
			{
				range: createDirectiveRange(5),
				selections: ["aaa"],
				type: "disable-lines-end",
			},
		]);

		expect(actual).toEqual([
			{
				lines: { begin: 1, end: 1 },
				selections: [/^aaa$/],
			},
			{
				lines: { begin: 2, end: 3 },
				selections: [/^aaa$/, /^bbb$/],
			},
			{
				lines: { begin: 4, end: 5 },
				selections: [/^aaa$/],
			},
		]);
	});

	it("merges disable-next-line directives that share extended range lines", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0, 2),
				selections: ["aaa"],
				type: "disable-next-line",
			},
			{
				range: createDirectiveRange(1, 2),
				selections: ["bbb"],
				type: "disable-next-line",
			},
		]);

		expect(actual).toEqual([
			{
				lines: { begin: 1, end: 1 },
				selections: [/^aaa$/],
			},
			{
				lines: { begin: 2, end: 3 },
				selections: [/^aaa$/, /^bbb$/],
			},
		]);
	});

	it("does not close a begin block when a disable-next-line with a different selection ends", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-lines-begin",
			},
			{
				range: createDirectiveRange(2),
				selections: ["bbb"],
				type: "disable-next-line",
			},
		]);

		// bbb on/off at line 3 creates a merged segment, aaa continues after
		expect(actual).toEqual([
			{
				lines: { begin: 1, end: 2 },
				selections: [/^aaa$/],
			},
			{
				lines: { begin: 3, end: 3 },
				selections: [/^aaa$/, /^bbb$/],
			},
			{
				lines: { begin: 4, end: Infinity },
				selections: [/^aaa$/],
			},
		]);
	});

	it("does not close a begin block when a disable-next-line with the same selection ends", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-lines-begin",
			},
			{
				range: createDirectiveRange(2),
				selections: ["aaa"],
				type: "disable-next-line",
			},
		]);

		expect(actual).toEqual([
			{
				lines: { begin: 1, end: 2 },
				selections: [/^aaa$/],
			},
			{
				lines: { begin: 3, end: 3 },
				selections: [/^aaa$/],
			},
			{
				lines: { begin: 4, end: Infinity },
				selections: [/^aaa$/],
			},
		]);
	});

	it("closes a same-line begin/end pair using raw source order", () => {
		const actual = computeDirectiveRanges([
			{
				range: {
					begin: { column: 0, line: 0, raw: 0 },
					end: { column: 10, line: 0, raw: 10 },
				},
				selections: ["aaa"],
				type: "disable-lines-begin",
			},
			{
				range: {
					begin: { column: 20, line: 0, raw: 20 },
					end: { column: 30, line: 0, raw: 30 },
				},
				selections: ["aaa"],
				type: "disable-lines-end",
			},
		]);

		expect(actual).toEqual([]);
	});

	it("ignores a duplicate disable-lines-begin for the same selection", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-lines-begin",
			},
			{
				range: createDirectiveRange(2),
				selections: ["aaa"],
				type: "disable-lines-begin",
			},
			{
				range: createDirectiveRange(5),
				selections: ["aaa"],
				type: "disable-lines-end",
			},
		]);

		expect(actual).toEqual([
			{
				lines: { begin: 1, end: 5 },
				selections: [/^aaa$/],
			},
		]);
	});

	it("uses range.end.line as the last disable-next-line range boundary", () => {
		const actual = computeDirectiveRanges([
			{
				range: createDirectiveRange(5, 7),
				selections: ["aaa"],
				type: "disable-next-line",
			},
		]);

		expect(actual).toEqual([
			{
				lines: { begin: 6, end: 8 },
				selections: [/^aaa$/],
			},
		]);
	});
});

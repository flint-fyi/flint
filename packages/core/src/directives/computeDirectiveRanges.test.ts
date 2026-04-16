import { describe, expect, it } from "vitest";

import type { CommentDirectiveWithinFile } from "../types/directives.ts";
import { computeDirectiveRanges } from "./computeDirectiveRanges.ts";
import { createSelectionMatcher } from "./createSelectionMatcher.ts";

function createDirective(
	overrides: CommentDirectiveWithinFile,
): CommentDirectiveWithinFile {
	return overrides;
}

function createDirectiveRange(forLine: number) {
	return {
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
	};
}

describe(computeDirectiveRanges, () => {
	it("returns [] when no directives are provided", () => {
		const actual = computeDirectiveRanges([]);
		expect(actual).toEqual([]);
	});

	it("returns a single range when one disable-lines-begin directive is provided", () => {
		const actual = computeDirectiveRanges([
			createDirective({
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-lines-begin",
			}),
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: Infinity,
				},
				selections: [createSelectionMatcher("aaa")],
			},
		]);
	});

	it("returns a single range when one disable-next-line directive is provided", () => {
		const actual = computeDirectiveRanges([
			createDirective({
				range: createDirectiveRange(0),
				selections: ["aaa"],
				type: "disable-next-line",
			}),
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: 1,
				},
				selections: [createSelectionMatcher("aaa")],
			},
		]);
	});

	it("returns two ranges when a disable-lines-begin and then an equivalent disable-lines-end are provided", () => {
		const actual = computeDirectiveRanges([
			createDirective({
				range: createDirectiveRange(0),
				selections: ["aaa", "bbb"],
				type: "disable-lines-begin",
			}),
			createDirective({
				range: createDirectiveRange(3),
				selections: ["aaa", "bbb"],
				type: "disable-lines-end",
			}),
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: 3,
				},
				selections: [
					createSelectionMatcher("aaa"),
					createSelectionMatcher("bbb"),
				],
			},
		]);
	});

	it("returns three ranges when a disable-lines-begin and then a partial disable-lines-end are provided", () => {
		const actual = computeDirectiveRanges([
			createDirective({
				range: createDirectiveRange(0),
				selections: ["aaa", "bbb"],
				type: "disable-lines-begin",
			}),
			createDirective({
				range: createDirectiveRange(3),
				selections: ["aaa"],
				type: "disable-lines-end",
			}),
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: 3,
				},
				selections: [
					createSelectionMatcher("aaa"),
					createSelectionMatcher("bbb"),
				],
			},
			{
				lines: {
					begin: 4,
					end: Infinity,
				},
				selections: [createSelectionMatcher("bbb")],
			},
		]);
	});

	it("returns three ranges when a disable-lines-begin and then a disable-next-line are provided", () => {
		const actual = computeDirectiveRanges([
			createDirective({
				range: createDirectiveRange(0),
				selections: ["aaa", "bbb"],
				type: "disable-lines-begin",
			}),
			createDirective({
				range: createDirectiveRange(1),
				selections: ["ccc"],
				type: "disable-next-line",
			}),
		]);

		expect(actual).toEqual([
			{
				lines: {
					begin: 1,
					end: 1,
				},
				selections: [
					createSelectionMatcher("aaa"),
					createSelectionMatcher("bbb"),
				],
			},
			{
				lines: {
					begin: 2,
					end: 2,
				},
				selections: [
					createSelectionMatcher("aaa"),
					createSelectionMatcher("bbb"),
					createSelectionMatcher("ccc"),
				],
			},
			{
				lines: {
					begin: 3,
					end: Infinity,
				},
				selections: [
					createSelectionMatcher("aaa"),
					createSelectionMatcher("bbb"),
				],
			},
		]);
	});

	it("treats regex metacharacters literally except for * wildcards", () => {
		const actual = computeDirectiveRanges([
			createDirective({
				range: createDirectiveRange(0),
				selections: ["file.name*test"],
				type: "disable-next-line",
			}),
		]);

		expect(actual[0]?.selections[0]?.test("file.name.test")).toBe(true);
		expect(actual[0]?.selections[0]?.test("file1name.test")).toBe(false);
	});
});

// @vitest/eslint-plugin doesn't recognize testProp.prop() as a test block.
/* eslint-disable vitest/no-standalone-expect */
import { fc, test as testProp } from "@fast-check/vitest";
import { describe, expect, test, vi } from "vitest";

import {
	getColumnAndLineOfPosition,
	getPositionOfColumnAndLine,
} from "./getColumnAndLineOfPosition.ts";

describe("getColumnAndLineOfPosition", () => {
	test("negative position", () => {
		const res = getColumnAndLineOfPosition("01", -1);

		expect(res).toEqual({
			column: 0,
			line: 0,
			raw: 0,
		});
	});

	test("empty source", () => {
		const res = getColumnAndLineOfPosition("", 0);

		expect(res).toEqual({
			column: 0,
			line: 0,
			raw: 0,
		});
	});

	test("empty source, pos bigger than source", () => {
		const res = getColumnAndLineOfPosition("", 1);

		expect(res).toEqual({
			column: 0,
			line: 0,
			raw: 0,
		});
	});

	test("two empty lines, first char of second line", () => {
		const res = getColumnAndLineOfPosition("\n", 1);

		expect(res).toEqual({
			column: 0,
			line: 1,
			raw: 1,
		});
	});

	test("single line", () => {
		const res = getColumnAndLineOfPosition("0123", 1);

		expect(res).toEqual({
			column: 1,
			line: 0,
			raw: 1,
		});
	});

	test("single line, pos is EOF", () => {
		const res = getColumnAndLineOfPosition("0123", 4);

		expect(res).toEqual({
			column: 4,
			line: 0,
			raw: 4,
		});
	});

	test("position is start of first line", () => {
		const res = getColumnAndLineOfPosition("0\n23", 0);

		expect(res).toEqual({
			column: 0,
			line: 0,
			raw: 0,
		});
	});

	test("position is on \\n", () => {
		const res = getColumnAndLineOfPosition("0\n23", 1);

		expect(res).toEqual({
			column: 1,
			line: 0,
			raw: 1,
		});
	});

	test("position is start of line", () => {
		const res = getColumnAndLineOfPosition("0\n23", 2);

		expect(res).toEqual({
			column: 0,
			line: 1,
			raw: 2,
		});
	});

	test("position is end of line", () => {
		const res = getColumnAndLineOfPosition("0\n23", 3);

		expect(res).toEqual({
			column: 1,
			line: 1,
			raw: 3,
		});
	});

	test("position is bigger than the source", () => {
		const res = getColumnAndLineOfPosition("0\n23", 4);

		expect(res).toEqual({
			column: 2,
			line: 1,
			raw: 4,
		});
	});

	test("position is much bigger than the source", () => {
		const res = getColumnAndLineOfPosition("0\n23", 999);

		expect(res).toEqual({
			column: 2,
			line: 1,
			raw: 3,
		});
	});

	test("position is much bigger than the source - 2", () => {
		const res = getColumnAndLineOfPosition("0\n23\n56", 999);

		expect(res).toEqual({
			column: 2,
			line: 2,
			raw: 6,
		});
	});

	test("position is much bigger than the source - \\r", () => {
		const res = getColumnAndLineOfPosition("0\r23\r56", 999);

		expect(res).toEqual({
			column: 2,
			line: 2,
			raw: 6,
		});
	});

	test("\\r\\n line endings", () => {
		const res = getColumnAndLineOfPosition("0\r\n34\r\n78", 3);

		expect(res).toEqual({
			column: 0,
			line: 1,
			raw: 3,
		});
	});

	test("\\r\\n line endings - 2", () => {
		const res = getColumnAndLineOfPosition("0\r\n34\r\n78", 8);

		expect(res).toEqual({
			column: 1,
			line: 2,
			raw: 8,
		});
	});

	test("mixed line endings", () => {
		const res = getColumnAndLineOfPosition("0\r2\n4\r6\n7", 2);

		expect(res).toEqual({
			column: 0,
			line: 1,
			raw: 2,
		});
	});

	test("mixed line endings - 2", () => {
		const res = getColumnAndLineOfPosition("0\r2\n4\r6\n7", 4);

		expect(res).toEqual({
			column: 0,
			line: 2,
			raw: 4,
		});
	});

	test("mixed line endings - 3", () => {
		const res = getColumnAndLineOfPosition("0\r2\n4\r6\n7", 6);

		expect(res).toEqual({
			column: 0,
			line: 3,
			raw: 6,
		});
	});

	test("mixed line endings - 4", () => {
		const res = getColumnAndLineOfPosition("0\r2\n4\r6\n8", 8);

		expect(res).toEqual({
			column: 0,
			line: 4,
			raw: 8,
		});
	});

	test("calls getLineAndCharacterOfPosition if present", () => {
		const getLineAndCharacterOfPosition = vi.fn(() => ({
			character: 999,
			line: 888,
		}));
		const res = getColumnAndLineOfPosition(
			{
				getLineAndCharacterOfPosition,
			},
			8,
		);

		expect(getLineAndCharacterOfPosition).toHaveBeenCalledExactlyOnceWith(8);
		expect(res).toEqual({
			column: 999,
			line: 888,
			raw: 8,
		});
	});

	test("caches lineMap between invocations", () => {
		const sourceWithMap = {
			text: "0\n23",
		};

		const res = getColumnAndLineOfPosition(sourceWithMap, 3);

		expect(res).toEqual({
			column: 1,
			line: 1,
			raw: 3,
		});
		expect(sourceWithMap).toEqual({
			lineMap: [0, 2],
			text: "0\n23",
		});
	});

	test("reuses lineMap between invocations", () => {
		const sourceWithMap = {
			lineMap: [0, 3], // intentionally invalid lineMap
			text: "0\n23",
		};

		const res = getColumnAndLineOfPosition(sourceWithMap, 3);

		expect(res).toEqual({
			column: 0,
			line: 1,
			raw: 3,
		});
		expect(sourceWithMap).toEqual({
			lineMap: [0, 3],
			text: "0\n23",
		});
	});
});

describe("getPositionOfColumnAndLine", () => {
	test("clamps negative line", () => {
		const res = getPositionOfColumnAndLine("012", { column: 1, line: -1 });

		expect(res).toBe(1);
	});

	test("clamps line after EOF", () => {
		const res = getPositionOfColumnAndLine("012", { column: 1, line: 1 });

		expect(res).toBe(1);
	});

	test("clamps column", () => {
		const res = getPositionOfColumnAndLine("012\n45", { column: 4, line: 0 });

		expect(res).toBe(3);
	});

	test("clamps column with empty line before it", () => {
		const res = getPositionOfColumnAndLine("012\n\n56", { column: 5, line: 1 });

		expect(res).toBe(4);
	});

	test("clamps column on the last line to EOF", () => {
		const res = getPositionOfColumnAndLine("012", { column: 5, line: 1 });

		expect(res).toBe(3);
	});

	test("column on EOF", () => {
		const res = getPositionOfColumnAndLine("012", { column: 3, line: 1 });

		expect(res).toBe(3);
	});

	describe("properties", () => {
		// Use LF-only sources to avoid CR/LF boundary ambiguity in roundtrips.
		const lfSource = fc
			.array(fc.stringMatching(/^[^\r\n]{0,8}$/), { maxLength: 8 })
			.map((lines) => lines.join("\n"));

		testProp.prop([lfSource])(
			"roundtrips position → column/line → position",
			(source) => {
				for (let position = 0; position <= source.length; position++) {
					const columnAndLine = getColumnAndLineOfPosition(source, position);
					const roundtripped = getPositionOfColumnAndLine(
						source,
						columnAndLine,
					);

					expect(roundtripped).toEqual(position);
				}
			},
		);

		testProp.prop([lfSource])(
			"column never exceeds the length of its line",
			(source) => {
				const lines = source.split("\n");
				for (let position = 0; position <= source.length; position++) {
					const { column, line } = getColumnAndLineOfPosition(source, position);
					const lineText = lines[line] ?? "";

					expect(column).toBeLessThanOrEqual(lineText.length);
					expect(column).toBeGreaterThanOrEqual(0);
				}
			},
		);
	});
});

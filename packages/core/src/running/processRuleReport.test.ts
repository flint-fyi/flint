import { describe, expect, it, vi } from "vitest";

import type { CharacterReportRange } from "../types/ranges.ts";
import { processRuleReport } from "./processRuleReport.ts";

describe(processRuleReport, () => {
	it("drops a fix when its range cannot be mapped as a change", () => {
		const adjustReportRange = vi.fn(
			(_range: CharacterReportRange, kind: "change" | "report") =>
				kind === "report" ? { begin: 1, end: 2 } : null,
		);

		const report = processRuleReport(
			{
				about: { sourceText: "abc" },
				adjustReportRange,
			} as never,
			{
				about: { description: "Description", id: "rule" },
				messages: {
					message: { primary: "Message", secondary: [], suggestions: [] },
				},
			} as never,
			{
				fix: { range: { begin: 0, end: 1 }, text: "x" },
				message: "message",
				range: { begin: 0, end: 1 },
			},
		);

		expect(report?.range).toEqual({
			begin: expect.objectContaining({ column: 1, line: 0 }),
			end: expect.objectContaining({ column: 2, line: 0 }),
		});
		expect(report?.fix).toEqual([]);
		expect(adjustReportRange.mock.calls.map(([, kind]) => kind)).toEqual([
			"report",
			"change",
		]);
	});
});

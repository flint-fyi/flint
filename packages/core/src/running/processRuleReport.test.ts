import { describe, expect, it, vi } from "vitest";

import { processRuleReport } from "./processRuleReport.ts";

describe(processRuleReport, () => {
	it("uses edit-safe range mapping for fixes", () => {
		const adjustReportRange = vi.fn(() => ({ begin: 1, end: 2 }));
		const adjustFixRange = vi.fn(() => null);

		const report = processRuleReport(
			{
				about: { sourceText: "abc" },
				adjustFixRange,
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
		expect(adjustReportRange).toHaveBeenCalledOnce();
		expect(adjustFixRange).toHaveBeenCalledOnce();
	});
});

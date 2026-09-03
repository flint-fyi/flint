import { describe, expect, it, vi } from "vitest";

import { createLanguage } from "../languages/createLanguage.ts";
import { processRuleReport } from "./processRuleReport.ts";

const language = createLanguage({
	about: { name: "Test" },
	createFileFactory: vi.fn(),
	runFileVisitors: vi.fn(),
});

const rule = language.createRule({
	about: { description: "", id: "standalone" },
	messages: {
		found: { primary: "", secondary: [], suggestions: [] },
	},
	setup: vi.fn(),
});

describe(processRuleReport, () => {
	it("preserves standalone rule IDs", () => {
		const report = processRuleReport(
			{
				about: {
					filePath: "file.ts",
					filePathAbsolute: "/file.ts",
					sourceText: "a",
				},
				services: {},
				[Symbol.dispose]: vi.fn(),
			},
			rule,
			{ message: "found", range: { begin: 0, end: 1 } },
		);

		expect(report?.about.id).toBe("standalone");
	});
});

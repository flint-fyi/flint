import { describe, expect, it } from "vitest";

import { convertTypeScriptDiagnosticToLanguageReport } from "./convertTypeScriptDiagnosticToLanguageReport.ts";

describe("convertTypeScriptDiagnosticToLanguageReport", () => {
	it("sets source to typescript", () => {
		const report = convertTypeScriptDiagnosticToLanguageReport({
			code: 1234,
			file: undefined,
			length: undefined,
			messageText: "TypeScript diagnostic",
			start: undefined,
		});

		expect(report).toMatchObject({
			code: "TS1234",
			source: "typescript",
		});
	});
});

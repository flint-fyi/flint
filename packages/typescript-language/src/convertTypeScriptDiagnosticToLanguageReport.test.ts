import { stripVTControlCharacters } from "node:util";

import { describe, expect, it } from "vitest";

import { convertTypeScriptDiagnosticToLanguageReport } from "./convertTypeScriptDiagnosticToLanguageReport.ts";

describe("convertTypeScriptDiagnosticToLanguageReport", () => {
	it("sets source to typescript", () => {
		const report = convertTypeScriptDiagnosticToLanguageReport(
			{
				code: 1234,
				file: undefined,
				length: undefined,
				messageText: "TypeScript diagnostic",
				start: undefined,
			},
			"/root",
		);

		expect(report).toMatchObject({
			code: "TS1234",
			source: "typescript",
		});
	});

	it("displays the file location relative to the current directory", () => {
		const report = convertTypeScriptDiagnosticToLanguageReport(
			{
				code: 1234,
				file: { fileName: "/root/src/a.ts", text: "let a;\n" },
				length: 1,
				messageText: "TypeScript diagnostic",
				start: 4,
			},
			"/root",
		);

		expect(stripVTControlCharacters(report.text)).toMatch(
			/^src\/a\.ts:1:5 - TS1234/,
		);
	});
});

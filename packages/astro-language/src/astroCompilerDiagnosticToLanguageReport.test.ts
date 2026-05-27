import { parse } from "@astrojs/compiler/sync";
import { assert, describe, expect, it } from "vitest";

import { astroCompilerDiagnosticToLanguageReport } from "./astroCompilerDiagnosticToLanguageReport.ts";

describe("astroCompilerDiagnosticToLanguageReport", () => {
	it("location.line and location.column are 1-indexed", () => {
		// WARNING_SET_WITH_CHILDREN: set:html with child nodes on line 2
		// "<div>\n" = 6 chars, then "<div " = 5 chars → "set:html" starts at offset 11
		const sourceText = '<div>\n<div set:html="foo">child</div>';
		const { diagnostics } = parse(sourceText, undefined);

		expect(diagnostics).toHaveLength(1);

		const diagnostic = diagnostics[0];

		assert.ok(diagnostic !== undefined);

		const report = astroCompilerDiagnosticToLanguageReport(
			"file.astro",
			{ text: sourceText },
			diagnostic,
		);

		expect(report.range).toEqual({ begin: 11, end: 19 }); // "set:html" = 8 chars
		expect(sourceText.slice(11, 19)).toBe("set:html");
		expect(report.text).toContain(":2:6");
	});
});

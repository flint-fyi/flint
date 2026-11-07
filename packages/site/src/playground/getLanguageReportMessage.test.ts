import { describe, expect, it } from "vitest";

import { getLanguageReportMessage } from "./getLanguageReportMessage.ts";

describe(getLanguageReportMessage, () => {
	it("returns the text when the report has no code", () => {
		const message = getLanguageReportMessage({ text: "Something failed." });

		expect(message).toBe("Something failed.");
	});

	it("removes the code prefix from a report without a file location", () => {
		const message = getLanguageReportMessage({
			code: "TS2318",
			text: "\u001B[90mTS2318\u001B[0m: Cannot find global type 'Array'.",
		});

		expect(message).toBe("Cannot find global type 'Array'.");
	});

	it("removes the file location, code prefix, and code frame", () => {
		const message = getLanguageReportMessage({
			code: "TS2322",
			text: [
				"\u001B[96mindex.ts\u001B[0m:\u001B[93m1\u001B[0m:\u001B[93m5\u001B[0m - \u001B[90mTS2322\u001B[0m: Type 'string' is not assignable to type 'number'.",
				"",
				"\u001B[7m1\u001B[0m let value: number = 'text';",
				"\u001B[7m \u001B[0m \u001B[91m    ~~~~~\u001B[0m",
			].join("\n"),
		});

		expect(message).toBe("Type 'string' is not assignable to type 'number'.");
	});

	it("preserves multiline message chains", () => {
		const message = getLanguageReportMessage({
			code: "TS2322",
			text: "TS2322: Type 'A' is not assignable to type 'B'.\n  Property 'b' is missing in type 'A'.\n\n1 const value: B = a;",
		});

		expect(message).toBe(
			"Type 'A' is not assignable to type 'B'.\n  Property 'b' is missing in type 'A'.",
		);
	});
});

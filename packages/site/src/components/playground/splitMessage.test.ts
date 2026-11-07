import { describe, expect, it } from "vitest";

import { splitMessage } from "./splitMessage.ts";

describe(splitMessage, () => {
	it("returns plain text as a single part", () => {
		expect(splitMessage("Prefer a for-of loop.")).toEqual([
			{ isCode: false, text: "Prefer a for-of loop." },
		]);
	});

	it("splits backtick-wrapped code from plain text", () => {
		expect(splitMessage("Prefer `const` over `let`.")).toEqual([
			{ isCode: false, text: "Prefer " },
			{ isCode: true, text: "const" },
			{ isCode: false, text: " over " },
			{ isCode: true, text: "let" },
			{ isCode: false, text: "." },
		]);
	});

	it("returns only code for a fully wrapped message", () => {
		expect(splitMessage("`debugger`")).toEqual([
			{ isCode: true, text: "debugger" },
		]);
	});

	it("keeps an unmatched backtick as plain text", () => {
		expect(splitMessage("Use ` here.")).toEqual([
			{ isCode: false, text: "Use ` here." },
		]);
	});

	it("returns no parts for an empty message", () => {
		expect(splitMessage("")).toEqual([]);
	});
});

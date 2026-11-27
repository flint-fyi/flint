import { describe, expect, it } from "vitest";

import { formatUrl } from "./formatUrl.ts";

describe("formatUrl", () => {
	it("formats an OSC 8 terminal hyperlink", () => {
		expect(formatUrl("https://flint.fyi", "flint.fyi")).toBe(
			"\u{1B}]8;;https://flint.fyi\u{7}flint.fyi\u{1B}]8;;\u{7}",
		);
	});
});

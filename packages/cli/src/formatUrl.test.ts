import { describe, expect, it } from "vitest";
import ansiSerializer from "vitest-ansi-serializer";

import { formatUrl } from "./formatUrl.ts";

expect.addSnapshotSerializer(ansiSerializer);

describe("formatUrl", () => {
	it("formats an OSC 8 terminal hyperlink", () => {
		expect(formatUrl("https://flint.fyi", "flint.fyi")).toMatchInlineSnapshot(
			`"<link url=https://flint.fyi>flint.fyi</link>"`,
		);
	});
});

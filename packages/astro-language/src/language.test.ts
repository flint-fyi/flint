import { describe, expect, it } from "vitest";

import { createAstroFileContext } from "./language.ts";

describe(createAstroFileContext, () => {
	it("reports directive offsets in authored text when earlier text is non-ASCII", () => {
		const sourceText =
			"<p>😀 é</p>\n<!-- flint-disable-next-line setHtmlDirectives -->\n<p></p>";
		const begin = sourceText.indexOf("flint-");

		expect(createAstroFileContext(sourceText).directives).toMatchObject([
			{
				range: {
					begin: { raw: begin },
					end: {
						raw: begin + "flint-disable-next-line setHtmlDirectives".length,
					},
				},
				selections: ["setHtmlDirectives"],
			},
		]);
	});
});

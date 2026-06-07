import { describe, expect, it } from "vitest";

import { vueParsingErrorsToLanguageReports } from "./vueParsingErrorsToLanguageReports.ts";

describe("vueParsingErrorsToLanguageReports", () => {
	it("sets source to vue", () => {
		const [report] = vueParsingErrorsToLanguageReports("Component.vue", [
			new SyntaxError("broken"),
		]);

		expect(report).toMatchObject({
			code: "VUE",
			source: "vue",
			text: "Component.vue - VUE: SyntaxError - broken",
		});
	});
});

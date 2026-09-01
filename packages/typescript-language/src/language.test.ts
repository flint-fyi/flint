import { describe, expect, it } from "vitest";

import { throwUnknownLanguageExtension } from "./language.ts";

describe(throwUnknownLanguageExtension, () => {
	it("suggests the matching Flint plugin", () => {
		expect(() => throwUnknownLanguageExtension("file.vue")).toThrow(
			"Cannot process file.vue. Did you install & import @flint.fyi/vue?",
		);
	});

	it("reports an unknown extension", () => {
		expect(() => throwUnknownLanguageExtension("file.unknown")).toThrow(
			"Cannot process file.unknown. Unknown extension.",
		);
	});
});

import { describe, expect, it } from "vitest";

import { createTestCaseSlug } from "./createTestCaseSlug.ts";

describe(createTestCaseSlug, () => {
	it("joins the entry labels and values when given a numeric rules count", () => {
		const actual = createTestCaseSlug({ files: 256, rules: 1 });

		expect(actual).toBe("files-256-rules-1");
	});

	it("lowercases values when given a named rules preset", () => {
		const actual = createTestCaseSlug({ files: 1024, rules: "common" });

		expect(actual).toBe("files-1024-rules-common");
	});
});

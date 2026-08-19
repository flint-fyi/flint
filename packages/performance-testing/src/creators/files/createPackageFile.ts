import type { TestCase } from "../../testCases.ts";
import { createTestCaseSlug } from "../../utils.ts";

export function createPackageFile(data: TestCase) {
	return {
		name: createTestCaseSlug(data),
		private: true,
		type: "module",
	};
}

import { createTestCaseSlug } from "../../createTestCaseSlug.ts";
import type { TestCase } from "../../testCases.ts";

export function createPackageFile(data: TestCase): object {
	return {
		name: createTestCaseSlug(data),
		private: true,
		type: "module",
	};
}

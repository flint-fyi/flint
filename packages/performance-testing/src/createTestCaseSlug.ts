import type { TestCase } from "./testCases.ts";

export function createTestCaseSlug(testCase: TestCase): string {
	return Object.entries(testCase).flat().join("-").toLowerCase();
}
